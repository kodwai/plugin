// Pins every kodwai CLI reference in the plugin to one exact version.
//
// Plugin directories (Claude, OpenAI) don't accept `npx pkg@latest` or an
// unversioned `npx pkg` in skill or script text: that code could change after
// review. So the skills run `npx @kodwai/cli@<exact version>`, and after each CLI
// release this script moves them to the new version:
//
//   npm run pin-cli            # the version npm has as latest
//   npm run pin-cli -- 1.11.0  # a specific version
//
// Then bump the plugin version (all three plugin.json files) and push.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2] || execFileSync("npm", ["view", "@kodwai/cli", "version"], { encoding: "utf-8" }).trim();
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Not an exact version: ${version}`);

// `npx -y @kodwai/cli@anything` or `npx @kodwai/cli` (unversioned) -> `npx @kodwai/cli@<version>`.
// Non-interactive npx installs without -y, so -y is dropped (directories flag it).
const NPX = /npx (?:-y )?@kodwai\/cli(?:@[A-Za-z0-9.\-]+)?(?![A-Za-z0-9.\-@\/])/g;

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (["node_modules", ".git", "dist"].includes(name)) return [];
    const full = join(dir, name);
    return statSync(full).isDirectory() ? files(full) : /\.(md|json|mjs|yaml)$/.test(name) ? [full] : [];
  });
}

let changed = 0;
for (const file of [join(ROOT, "README.md"), ...files(join(ROOT, "plugins", "kodwai"))]) {
  const text = readFileSync(file, "utf-8");
  const next = text.replace(NPX, `npx @kodwai/cli@${version}`);
  if (next !== text) {
    writeFileSync(file, next);
    changed++;
    console.log(`  ${file.slice(ROOT.length + 1)}`);
  }
}
console.log(`✔ kodwai CLI pinned to ${version} (${changed} file${changed === 1 ? "" : "s"} changed)`);
