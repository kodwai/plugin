// Builds the ZIP for OpenAI's plugin directory (ChatGPT and Codex) from plugins/kodwai.
//
// OpenAI's directory rules differ from what Codex itself accepts when you install
// from this repo, so the directory package is a variant:
//   - no hooks: "Plugin ZIPs containing ... lifecycle hooks cannot currently be
//     submitted". Users who install from GitHub still get the hooks; the CLI also
//     links sessions on its own from CODEX_THREAD_ID.
//   - no `disable-model-invocation` in skill frontmatter (the directory rejects it).
//     challenge / submit / abandon stay explicit-only through agents/openai.yaml
//     (`allow_implicit_invocation: false`), which is how Codex expresses it.
//   - only the Codex manifest and what it references.
//
// Output: dist/kodwai-openai-<version>.zip
// Run: npm run build:openai

import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "plugins", "kodwai");
const manifest = JSON.parse(readFileSync(join(SRC, ".codex-plugin", "plugin.json"), "utf-8"));
const OUT_DIR = join(ROOT, "dist");
const STAGE = join(OUT_DIR, "openai", "kodwai");
const ZIP = join(OUT_DIR, `kodwai-openai-${manifest.version}.zip`);

rmSync(join(OUT_DIR, "openai"), { recursive: true, force: true });
rmSync(ZIP, { force: true });
mkdirSync(STAGE, { recursive: true });

// Manifest: no hooks key, and nothing pointing at files we leave out.
delete manifest.hooks;
mkdirSync(join(STAGE, ".codex-plugin"));
writeFileSync(join(STAGE, ".codex-plugin", "plugin.json"), JSON.stringify(manifest, null, 2) + "\n");

cpSync(join(SRC, "assets"), join(STAGE, "assets"), { recursive: true });
cpSync(join(SRC, "README.md"), join(STAGE, "README.md"));

// Skills, minus the frontmatter key the directory rejects.
for (const skill of readdirSync(join(SRC, "skills"))) {
  const from = join(SRC, "skills", skill);
  const to = join(STAGE, "skills", skill);
  cpSync(from, to, { recursive: true });
  const md = join(to, "SKILL.md");
  const text = readFileSync(md, "utf-8").replace(/^disable-model-invocation:.*\n/m, "");
  writeFileSync(md, text);
  const yaml = join(to, "agents", "openai.yaml");
  const wasUserOnly = /^disable-model-invocation: true$/m.test(readFileSync(join(from, "SKILL.md"), "utf-8"));
  if (wasUserOnly && (!existsSync(yaml) || !/allow_implicit_invocation: false/.test(readFileSync(yaml, "utf-8")))) {
    throw new Error(`skills/${skill} is user-only but has no agents/openai.yaml with allow_implicit_invocation: false`);
  }
}

// Zip the plugin root's contents (manifest at the top level of the archive).
execFileSync("zip", ["-qrX", ZIP, ".", "-x", "*.DS_Store"], { cwd: STAGE });
console.log(`✔ ${ZIP.slice(ROOT.length + 1)}`);
