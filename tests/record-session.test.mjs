import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  detectAgent,
  candidateDirs,
  pickWorkspace,
  upsertSession,
  record,
} from "../plugins/kodwai/scripts/record-session.mjs";

const SCRIPT = fileURLToPath(new URL("../plugins/kodwai/scripts/record-session.mjs", import.meta.url));

function tmp() {
  return realpathSync(mkdtempSync(join(tmpdir(), "kodwai-plugin-test-")));
}

function makeWorkspace(parent, slug, meta = {}) {
  const ws = join(parent, `kodwai-${slug}`);
  mkdirSync(join(ws, ".kodwai"), { recursive: true });
  writeFileSync(
    join(ws, ".kodwai", "submission.json"),
    JSON.stringify({ submission_id: `sub-${slug}`, challenge_slug: slug, started_at: "2026-09-30T10:00:00.000Z", ...meta }),
  );
  return ws;
}

function sessions(ws) {
  return JSON.parse(readFileSync(join(ws, ".kodwai", "agent-sessions.json"), "utf-8")).sessions;
}

test("detectAgent: Claude Code, Codex and Cursor payloads", () => {
  assert.equal(detectAgent({ session_id: "a", transcript_path: "/h/.claude/projects/-x/a.jsonl" }, {}), "claude-code");
  assert.equal(
    detectAgent({ session_id: "b", transcript_path: "/h/.codex/sessions/2026/09/30/rollout-2026-09-30T13-34-28-b.jsonl" }, {}),
    "codex",
  );
  assert.equal(detectAgent({ session_id: "b", turn_id: "t1", transcript_path: null }, {}), "codex");
  assert.equal(detectAgent({ conversation_id: "c", workspace_roots: ["/w"], cursor_version: "2.6.1" }, {}), "cursor");
  // Cursor running a Claude Code hook file still reports as Cursor.
  assert.equal(detectAgent({ session_id: "c", transcript_path: "/h/x.jsonl" }, { CURSOR_VERSION: "2.6.1" }), "cursor");
});

test("candidateDirs: cwd, workspace roots and project dir env, deduplicated", () => {
  const dirs = candidateDirs({ cwd: "/a", workspace_roots: ["/b", "/a"] }, { CLAUDE_PROJECT_DIR: "/c" });
  assert.deepEqual(dirs, ["/a", "/b", "/c"]);
});

test("pickWorkspace: the folder itself, an ancestor, or a kodwai-* child", () => {
  const root = tmp();
  const ws = makeWorkspace(root, "rate-limiter");
  mkdirSync(join(ws, "src", "deep"), { recursive: true });
  assert.equal(pickWorkspace([ws])?.path, ws);
  assert.equal(pickWorkspace([join(ws, "src", "deep")])?.path, ws);
  assert.equal(pickWorkspace([root])?.path, ws, "session started in the parent folder");
  assert.equal(pickWorkspace([tmp()]), null);
});

test("pickWorkspace: skips submitted workspaces and prefers the newest", () => {
  const root = tmp();
  makeWorkspace(root, "old", { started_at: "2026-09-01T00:00:00.000Z" });
  const newest = makeWorkspace(root, "new", { started_at: "2026-09-30T12:00:00.000Z" });
  makeWorkspace(root, "done", { started_at: "2026-09-30T13:00:00.000Z", submitted_at: "2026-09-30T14:00:00.000Z" });
  assert.equal(pickWorkspace([root])?.path, newest);
  assert.equal(pickWorkspace([join(root, "kodwai-done")]), null, "never link into a submitted challenge");
});

test("upsertSession: inserts once, then refreshes in place", () => {
  const first = upsertSession(null, { agent: "claude-code", session_id: "s1", transcript_path: "/t1", last_event: "SessionStart" }, "2026-09-30T10:00:00Z");
  assert.equal(first.sessions.length, 1);
  const second = upsertSession(first, { agent: "claude-code", session_id: "s1", transcript_path: null, last_event: "Stop" }, "2026-09-30T10:05:00Z");
  assert.equal(second.sessions.length, 1);
  assert.equal(second.sessions[0].transcript_path, "/t1", "a later null path doesn't erase the known one");
  assert.equal(second.sessions[0].first_seen, "2026-09-30T10:00:00Z");
  assert.equal(second.sessions[0].last_seen, "2026-09-30T10:05:00Z");
  assert.equal(second.sessions[0].last_event, "Stop");
  const third = upsertSession(second, { agent: "cursor", session_id: "s1", transcript_path: "/t2", last_event: "stop" }, "2026-09-30T10:06:00Z");
  assert.equal(third.sessions.length, 2, "same id from another agent is a separate entry");
});

test("upsertSession: keeps at most 50 sessions, newest first", () => {
  let file = null;
  for (let i = 0; i < 60; i++) {
    file = upsertSession(file, { agent: "codex", session_id: `s${i}`, last_event: "Stop" }, `2026-09-30T10:${String(i).padStart(2, "0")}:00Z`);
  }
  assert.equal(file.sessions.length, 50);
  assert.equal(file.sessions[0].session_id, "s59");
});

test("record: writes agent-sessions.json in the workspace", () => {
  const root = tmp();
  const ws = makeWorkspace(root, "cache");
  const linked = record({ session_id: "abc", transcript_path: "/h/.claude/projects/x/abc.jsonl", cwd: root, hook_event_name: "Stop" }, {});
  assert.equal(linked, ws);
  const [entry] = sessions(ws);
  assert.equal(entry.agent, "claude-code");
  assert.equal(entry.session_id, "abc");
  assert.equal(entry.transcript_path, "/h/.claude/projects/x/abc.jsonl");
  assert.equal(entry.cwd, root);
});

test("record: nothing happens outside a kodwai workspace", () => {
  const dir = tmp();
  assert.equal(record({ session_id: "abc", transcript_path: "/t", cwd: dir }, {}), null);
  assert.equal(existsSync(join(dir, ".kodwai")), false);
  assert.equal(record({ cwd: dir }, {}), null, "no session id");
});

function runScript(input, env = {}) {
  return spawnSync(process.execPath, [SCRIPT], {
    input: typeof input === "string" ? input : JSON.stringify(input),
    encoding: "utf-8",
    env: { PATH: process.env.PATH, ...env },
  });
}

test("script: exits 0 and prints nothing for Claude Code and Codex", () => {
  const root = tmp();
  const ws = makeWorkspace(root, "queue");
  const cc = runScript({ session_id: "cc1", transcript_path: "/t/cc1.jsonl", cwd: ws, hook_event_name: "SessionStart" });
  assert.equal(cc.status, 0);
  assert.equal(cc.stdout, "", "SessionStart stdout would be injected into Claude's context");
  const cx = runScript({ session_id: "cx1", transcript_path: "/h/.codex/sessions/2026/09/30/rollout-2026-09-30T10-00-00-cx1.jsonl", cwd: ws, hook_event_name: "Stop", turn_id: "t" });
  assert.equal(cx.status, 0);
  assert.equal(cx.stdout, "");
  assert.deepEqual(sessions(ws).map((s) => s.agent).sort(), ["claude-code", "codex"]);
});

test("script: prints {} for Cursor and links via workspace_roots", () => {
  const root = tmp();
  const ws = makeWorkspace(root, "lru");
  const res = runScript({ conversation_id: "cur1", generation_id: "g", workspace_roots: [ws], cursor_version: "2.6.1", transcript_path: "/h/.cursor/projects/x/agent-transcripts/cur1.jsonl", hook_event_name: "stop" });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), "{}");
  const [entry] = sessions(ws);
  assert.equal(entry.agent, "cursor");
  assert.equal(entry.session_id, "cur1");
  assert.equal(entry.agent_version, "2.6.1");
});

test("script: survives garbage input and unwritable workspaces", () => {
  assert.equal(runScript("not json").status, 0);
  assert.equal(runScript("").status, 0);
  const root = tmp();
  const ws = makeWorkspace(root, "ro");
  writeFileSync(join(ws, ".kodwai", "agent-sessions.json"), "{broken");
  const res = runScript({ session_id: "x", transcript_path: "/t", cwd: ws });
  assert.equal(res.status, 0);
  assert.equal(sessions(ws)[0].session_id, "x", "a corrupt file is replaced, not fatal");
});
