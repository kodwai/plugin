// Checks the plugin for all three agents in one go:
//   - every manifest parses, and Cursor's validate against Cursor's official schemas
//   - names and versions agree across Claude Code, Codex and Cursor
//   - every referenced path exists, hooks point at a real script
//   - every skill has name/description frontmatter and its name matches its folder
//   - no em dashes in anything a user reads
// Run: npm run validate   (claude plugin validate runs separately in npm run check)

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN = join(ROOT, "plugins", "kodwai");
const errors = [];
const fail = (msg) => errors.push(msg);

function json(path) {
  try {
    return JSON.parse(readFileSync(join(ROOT, path), "utf-8"));
  } catch (e) {
    fail(`${path}: ${e.message}`);
    return null;
  }
}

function exists(base, rel, what) {
  if (!existsSync(join(base, rel))) fail(`${what}: ${rel} does not exist`);
}

// Manifests
const manifests = {
  claude: json("plugins/kodwai/.claude-plugin/plugin.json"),
  codex: json("plugins/kodwai/.codex-plugin/plugin.json"),
  cursor: json("plugins/kodwai/.cursor-plugin/plugin.json"),
};
const markets = {
  claude: json(".claude-plugin/marketplace.json"),
  codex: json(".agents/plugins/marketplace.json"),
  cursor: json(".cursor-plugin/marketplace.json"),
};

const versions = new Set(Object.values(manifests).map((m) => m?.version));
if (versions.size !== 1) fail(`versions differ across manifests: ${[...versions].join(", ")}`);
for (const [agent, m] of Object.entries(manifests)) {
  if (m?.name !== "kodwai") fail(`${agent} plugin.json name is "${m?.name}", expected "kodwai"`);
}

// Marketplaces point at the plugin folder and use the same plugin name.
const sourcePath = { claude: (p) => p.source, codex: (p) => p.source?.path, cursor: (p) => p.source };
for (const [agent, market] of Object.entries(markets)) {
  const entry = market?.plugins?.find((p) => p.name === "kodwai");
  if (!entry) {
    fail(`${agent} marketplace has no "kodwai" plugin entry`);
    continue;
  }
  const src = sourcePath[agent](entry);
  if (!src || !existsSync(join(ROOT, src))) fail(`${agent} marketplace source "${src}" does not exist`);
}

// Cursor: official schemas (additionalProperties: false, so typos fail here).
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
for (const [name, data] of [["plugin", manifests.cursor], ["marketplace", markets.cursor]]) {
  const schema = JSON.parse(readFileSync(join(ROOT, "schemas", "cursor", `${name}.schema.json`), "utf-8"));
  const validate = ajv.compile(schema);
  if (data && !validate(data)) {
    for (const err of validate.errors) fail(`cursor ${name}.json ${err.instancePath || "/"} ${err.message}`);
  }
}

// Paths referenced by manifests.
if (manifests.cursor) {
  exists(PLUGIN, manifests.cursor.skills, "cursor skills");
  exists(PLUGIN, manifests.cursor.hooks, "cursor hooks");
  exists(PLUGIN, manifests.cursor.logo, "cursor logo");
}
if (manifests.codex) {
  exists(PLUGIN, manifests.codex.skills, "codex skills");
  for (const key of ["logo", "composerIcon"]) exists(PLUGIN, manifests.codex.interface?.[key], `codex interface.${key}`);
}

// Hooks: parse, and every command points at the recorder script, which exists.
const script = "scripts/record-session.mjs";
exists(PLUGIN, script, "hook script");
const claudeHooks = json("plugins/kodwai/hooks/hooks.json");
for (const [event, groups] of Object.entries(claudeHooks?.hooks ?? {})) {
  for (const group of groups) {
    for (const hook of group.hooks ?? []) {
      if (!hook.command?.includes(`\${CLAUDE_PLUGIN_ROOT}/${script}`)) fail(`hooks.json ${event}: unexpected command ${hook.command}`);
    }
  }
}
const cursorHooks = json("plugins/kodwai/hooks/hooks-cursor.json");
if (cursorHooks?.version !== 1) fail("hooks-cursor.json needs \"version\": 1");
for (const [event, hooks] of Object.entries(cursorHooks?.hooks ?? {})) {
  if (event[0] !== event[0].toLowerCase()) fail(`hooks-cursor.json: Cursor event names are camelCase (${event})`);
  for (const hook of hooks) {
    if (!hook.command?.includes(`\${CURSOR_PLUGIN_ROOT}/${script}`)) fail(`hooks-cursor.json ${event}: unexpected command ${hook.command}`);
  }
}

// Skills: frontmatter name matches the folder (Cursor requires it), description present.
const skillsDir = join(PLUGIN, "skills");
const skills = readdirSync(skillsDir).filter((d) => statSync(join(skillsDir, d)).isDirectory());
for (const skill of skills) {
  const path = join(skillsDir, skill, "SKILL.md");
  if (!existsSync(path)) {
    fail(`skills/${skill}: missing SKILL.md`);
    continue;
  }
  const text = readFileSync(path, "utf-8");
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) {
    fail(`skills/${skill}/SKILL.md: missing frontmatter`);
    continue;
  }
  const field = (k) => fm[1].match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1].trim();
  if (field("name") !== skill) fail(`skills/${skill}/SKILL.md: name "${field("name")}" must match the folder`);
  const description = field("description");
  if (!description) fail(`skills/${skill}/SKILL.md: missing description`);
  else if (description.length > 1024) fail(`skills/${skill}/SKILL.md: description over 1024 chars`);
}
for (const skill of ["challenge", "submit", "abandon"]) {
  const text = readFileSync(join(skillsDir, skill, "SKILL.md"), "utf-8");
  if (!/^disable-model-invocation: true$/m.test(text)) fail(`skills/${skill}: must be user-invoked only (disable-model-invocation)`);
  const yaml = join(skillsDir, skill, "agents", "openai.yaml");
  if (!existsSync(yaml) || !/allow_implicit_invocation: false/.test(readFileSync(yaml, "utf-8"))) {
    fail(`skills/${skill}: Codex needs agents/openai.yaml with allow_implicit_invocation: false`);
  }
}

// Copy rule: no em dashes anywhere a person reads.
const EM_DASH = String.fromCharCode(0x2014);
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "schemas"].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(md|json|yaml|mjs)$/.test(entry.name) && readFileSync(full, "utf-8").includes(EM_DASH)) {
      fail(`${full.slice(ROOT.length + 1)}: contains an em dash`);
    }
  }
}
walk(ROOT);

// Every way the plugin runs the CLI is pinned to one exact version: directories
// reject `npx pkg@latest` and unversioned `npx pkg`. A bare package name in prose
// or a link (npmjs.com/package/@kodwai/cli) isn't a launcher and is fine.
const pinned = new Set();
function checkPins(text, rel) {
  for (const m of text.matchAll(/(npx (?:-y )?)?@kodwai\/cli(@[A-Za-z0-9.\-]+)?/g)) {
    const launcher = Boolean(m[1]);
    const v = m[2]?.slice(1);
    if (v && /^\d+\.\d+\.\d+$/.test(v)) pinned.add(v);
    else if (v || launcher) fail(`${rel}: pin the CLI to an exact version, found "${m[0]}" (npm run pin-cli)`);
    if (m[1]?.includes("-y")) fail(`${rel}: drop -y from npx (npm run pin-cli)`);
  }
}
function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) scan(full);
    else if (/\.(md|json|mjs|yaml)$/.test(entry.name)) checkPins(readFileSync(full, "utf-8"), full.slice(ROOT.length + 1));
  }
}
scan(PLUGIN);
checkPins(readFileSync(join(ROOT, "README.md"), "utf-8"), "README.md");
if (pinned.size > 1) fail(`CLI pinned to more than one version: ${[...pinned].join(", ")} (npm run pin-cli)`);
for (const skill of skills) {
  if (/sk-ant-[A-Za-z0-9]{8,}/.test(readFileSync(join(skillsDir, skill, "SKILL.md"), "utf-8"))) {
    fail(`skills/${skill}: contains something that looks like a real API key`);
  }
}

if (errors.length) {
  console.error(`✖ ${errors.length} problem(s):\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(`✔ kodwai plugin valid: ${skills.length} skills, 3 manifests, 3 marketplaces, 2 hook files`);
