#!/usr/bin/env node
// Links the running agent session to a kodwai challenge workspace.
//
// Claude Code, Codex and Cursor call this from their SessionStart / Stop /
// SessionEnd hooks with a JSON payload on stdin that names the session and its
// transcript file. When the session's folder is a kodwai workspace (or holds
// one, when the challenge was started from the parent folder), we upsert
// { agent, session_id, transcript_path } into <workspace>/.kodwai/agent-sessions.json.
// `kodwai submit` reads that file to find this session's transcript exactly,
// instead of guessing from folder names.
//
// Only paths and ids are written, never transcript content. Nothing leaves the
// machine here. The script never blocks the agent: it always exits 0, and it
// prints nothing except the empty JSON object Cursor expects.

import { readFileSync, readdirSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const MAX_SESSIONS = 50;
const FILE_VERSION = 1;

/** Which agent is calling. Cursor also runs Claude Code hooks, so trust the payload, not the hook file. */
export function detectAgent(input, env = process.env) {
  if (input.cursor_version || Array.isArray(input.workspace_roots) || env.CURSOR_VERSION) return "cursor";
  const transcript = typeof input.transcript_path === "string" ? input.transcript_path : "";
  if (/(^|[\\/])rollout-[^\\/]*\.jsonl$/.test(transcript) || "turn_id" in input) return "codex";
  return "claude-code";
}

/** Folders this session works in, most specific first. */
export function candidateDirs(input, env = process.env) {
  const dirs = [];
  if (typeof input.cwd === "string" && input.cwd) dirs.push(input.cwd);
  if (Array.isArray(input.workspace_roots)) {
    for (const root of input.workspace_roots) if (typeof root === "string" && root) dirs.push(root);
  }
  for (const key of ["CURSOR_PROJECT_DIR", "CLAUDE_PROJECT_DIR"]) if (env[key]) dirs.push(env[key]);
  return [...new Set(dirs.map((d) => resolve(d)))];
}

function readMeta(workspace) {
  try {
    const meta = JSON.parse(readFileSync(join(workspace, ".kodwai", "submission.json"), "utf-8"));
    return meta && typeof meta.submission_id === "string" ? meta : null;
  } catch {
    return null;
  }
}

/**
 * The kodwai workspace for a folder: the folder itself or an ancestor holding
 * .kodwai/submission.json, else a kodwai-* child of it (the CLI creates the
 * workspace inside the folder the agent was started in).
 */
export function workspacesFor(dir) {
  const found = [];
  for (let d = dir; ; d = dirname(d)) {
    const meta = readMeta(d);
    if (meta) {
      found.push({ path: d, meta });
      return found;
    }
    if (dirname(d) === d) break;
  }
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("kodwai-")) continue;
    const path = join(dir, entry.name);
    const meta = readMeta(path);
    if (meta) found.push({ path, meta });
  }
  return found;
}

/** The workspace to link: the newest one that isn't submitted yet (the API allows one challenge at a time). */
export function pickWorkspace(dirs) {
  let best = null;
  for (const dir of dirs) {
    for (const ws of workspacesFor(dir)) {
      if (ws.meta.submitted_at) continue;
      if (!best || String(ws.meta.started_at || "") > String(best.meta.started_at || "")) best = ws;
    }
  }
  return best;
}

/** Insert or refresh this session's entry. Pure, so it's easy to test. */
export function upsertSession(file, entry, now = new Date().toISOString()) {
  const sessions = Array.isArray(file?.sessions) ? file.sessions.filter((s) => s && s.session_id) : [];
  const existing = sessions.find((s) => s.agent === entry.agent && s.session_id === entry.session_id);
  if (existing) {
    if (entry.transcript_path) existing.transcript_path = entry.transcript_path;
    if (entry.cwd) existing.cwd = entry.cwd;
    if (entry.agent_version) existing.agent_version = entry.agent_version;
    existing.last_event = entry.last_event;
    existing.last_seen = now;
  } else {
    sessions.push({ ...entry, first_seen: now, last_seen: now });
  }
  sessions.sort((a, b) => String(b.last_seen).localeCompare(String(a.last_seen)));
  return { version: FILE_VERSION, sessions: sessions.slice(0, MAX_SESSIONS) };
}

/** Handle one hook payload. Returns the workspace it linked, or null. */
export function record(input, env = process.env) {
  const sessionId = input.session_id || input.conversation_id;
  if (!sessionId || typeof sessionId !== "string") return null;

  const workspace = pickWorkspace(candidateDirs(input, env));
  if (!workspace) return null;

  const agent = detectAgent(input, env);
  const entry = {
    agent,
    session_id: sessionId,
    transcript_path: typeof input.transcript_path === "string" && input.transcript_path ? input.transcript_path : null,
    cwd: typeof input.cwd === "string" ? input.cwd : (input.workspace_roots || [])[0] || null,
    last_event: input.hook_event_name || null,
    ...(input.cursor_version ? { agent_version: String(input.cursor_version) } : {}),
  };

  const dir = join(workspace.path, ".kodwai");
  const target = join(dir, "agent-sessions.json");
  let current = null;
  try {
    current = JSON.parse(readFileSync(target, "utf-8"));
  } catch {
    // first link for this workspace
  }
  const next = upsertSession(current, entry);
  mkdirSync(dir, { recursive: true });
  const tmp = `${target}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(next, null, 2) + "\n", "utf-8");
  renameSync(tmp, target);
  return workspace.path;
}

function readStdin() {
  try {
    return readFileSync(0, "utf-8");
  } catch {
    return "";
  }
}

function main() {
  let input = {};
  try {
    input = JSON.parse(readStdin() || "{}");
  } catch {
    input = {};
  }
  try {
    record(input);
  } catch {
    // Never get in the agent's way.
  }
  if (detectAgent(input) === "cursor") process.stdout.write("{}\n");
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
