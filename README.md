# kodwai plugin for Claude Code, Codex and Cursor

Start, check and submit [kodwai](https://www.kodwai.com) challenges without leaving your agent. The plugin also links your agent session to the challenge, so `kodwai submit` uploads exactly the right transcript, even when you started the agent in the folder above the challenge.

kodwai is where developers prove they can drive an AI agent. You solve a real challenge on your own machine with your own agent, then submit the session. kodwai scores it on three axes: **Direction** (how you steer the agent), **Outcome** (does it work) and **Lift** (did you catch the traps).

## What you get

Everything you'd do on app.kodwai.com, from your agent. Ask in plain words ("where am I in my league?", "why did my last run score low?", "which badges am I close to?") and the agent picks the right command, or type the command yourself.

| Command | What it covers |
|---|---|
| `/kodwai:challenges` | Browse and search challenges, one challenge's spec and rubric and top 10, the Challenge of the Day, the weekly sprint, events |
| `/kodwai:leaderboard` | All-time board (by agent, model, category) with your rank, any challenge's board, your weekly league and its zones |
| `/kodwai:profile` | Tier, Direction Elo, level and XP, rank, streak, mastery, badges and progress, quests (and claiming XP), Wrapped, your README rank card, anyone's public profile |
| `/kodwai:runs` | Your run history, a run's full result with every signal and the judge's evidence, share links, rating a challenge |
| `/kodwai:account` | Username, scoring key and free runs, feedback to the kodwai team and the replies, open any kodwai page |
| `/kodwai:challenge <slug>` | Start a challenge in this folder: creates `kodwai-<slug>/`, starts the clock |
| `/kodwai:status` | Time left and files so far, or your score once submitted |
| `/kodwai:submit` | Asks once, then submits and shows your score |
| `/kodwai:abandon` | Drops the challenge in progress without a score |

Plus:

- **A rules skill** that tells the agent how a kodwai workspace works: you lead, it never submits on its own, it leaves `.kodwai/` and the provided tests alone.
- **Session hooks** (SessionStart, Stop, SessionEnd) that record the session id and transcript path in `<workspace>/.kodwai/agent-sessions.json`. Only ids and paths are written, never content, and nothing leaves your machine until you submit.

Guardrails:

- `/kodwai:challenge`, `/kodwai:submit` and `/kodwai:abandon` only run when you type them.
- The agent shows you feedback, ratings, profile edits and username changes before sending them.
- Your Anthropic key never goes through the chat. `key add` opens the settings page (or a hidden prompt in your own terminal), and the agent won't use a key pasted into the conversation.
- Password changes stay on the website.

## What this plugin runs and sends

Being exact about it:

- **The skills run one program: the kodwai CLI,** via `npx -y @kodwai/cli@latest <command>` ([source](https://github.com/kodwai/cli), [npm](https://www.npmjs.com/package/@kodwai/cli)). Your agent asks your permission before running it, as it does for any shell command.
- **The CLI talks to one service: the kodwai API** at `https://api.kodwai.com`, over HTTPS.
  - To read your challenges, leaderboards, profile, badges, quests and runs, and to make the changes you ask for (claiming quests, sharing, ratings, feedback, profile and username).
  - When you submit a challenge, it uploads that challenge folder's code, git history and test results, plus the transcript of the agent session linked to it.
  - Nothing is uploaded without a command you ran or approved.
- **Your sign-in is a token the CLI keeps in `~/.kodwai/config.json`,** created when you approve "Authorize CLI" in your browser. The CLI sends it only to the kodwai API. The plugin never reads it.
- **The hook script (`scripts/record-session.mjs`) is local only.**
  - It reads the hook's JSON input (session id, transcript file path, working folder) and three environment variables: `CLAUDE_PROJECT_DIR`, `CURSOR_PROJECT_DIR` and `CURSOR_VERSION`.
  - It writes the session id and transcript path to `.kodwai/agent-sessions.json` inside the challenge folder, and only when the folder is a kodwai challenge.
  - It makes no network calls and never reads transcript contents.
- **Your Anthropic API key never passes through the plugin or the chat.** You enter it on the kodwai settings page or in a hidden prompt in your own terminal.

Privacy policy: https://www.kodwai.com/privacy. Terms: https://www.kodwai.com/terms.

In Codex, skills are invoked with `$` instead of `/`: `$kodwai:leaderboard`.

## Install

### Claude Code

```
/plugin marketplace add kodwai/plugin
/plugin install kodwai@kodwai
```

Or from your shell: `claude plugin marketplace add kodwai/plugin && claude plugin install kodwai@kodwai`.

### Codex

```
codex plugin marketplace add kodwai/plugin
codex plugin add kodwai@kodwai
```

Codex doesn't run a plugin's hooks until you trust them. Open Codex, run `/hooks`, and trust the three kodwai hooks. Without that the commands still work, and the CLI still links the session by itself when you start the challenge from inside Codex.

### Cursor

In Cursor: **Customize → Plugins → From GitHub Repository** → `https://github.com/kodwai/plugin`.

## How a challenge goes

1. Open your agent in any folder and run `/kodwai:challenge rate-limiter`. Pick a challenge at [app.kodwai.com/dev/challenges](https://app.kodwai.com/dev/challenges).
   - The first time, the agent shows you kodwai's data collection notice and asks if you accept.
   - Your browser opens to sign in.
2. Work on it with your agent, in the same session. Everything happens inside `kodwai-rate-limiter/`.
3. Run `/kodwai:status` whenever you want to see the clock.
4. When you're done, run `/kodwai:submit`. It runs the tests, uploads the code, git history, test results and this session's transcript, then shows your score.

The CLI underneath is [@kodwai/cli](https://www.npmjs.com/package/@kodwai/cli), run with `npx -y @kodwai/cli@latest`. You can use it directly from any terminal too.

## Requirements

- Node.js 20 or newer (the CLI and the hook script both run on Node)
- git
- In sandboxed agents (Codex), the kodwai commands need network access. The agent asks to run them outside the sandbox.

## Develop

```
npm install
npm run check     # recorder tests + manifest/schema validation + claude plugin validate
```

Try it locally without installing:

- **Claude Code:** `claude --plugin-dir ./plugins/kodwai`
- **Codex:** `codex plugin marketplace add ./` then `codex plugin add kodwai@kodwai`
- **Cursor:** copy `plugins/kodwai` to `~/.cursor/plugins/local/kodwai` and reload the window.

Layout:

```
.claude-plugin/marketplace.json     Claude Code marketplace
.agents/plugins/marketplace.json    Codex marketplace
.cursor-plugin/marketplace.json     Cursor marketplace (GitHub import)
plugins/kodwai/
  .claude-plugin/plugin.json        manifests, one per agent
  .codex-plugin/plugin.json
  .cursor-plugin/plugin.json
  skills/                           challenges, leaderboard, profile, runs, account,
                                    challenge, submit, status, abandon, rules (shared by all 3)
  hooks/hooks.json                  Claude Code + Codex hooks
  hooks/hooks-cursor.json           Cursor hooks
  scripts/record-session.mjs        links the session to the workspace
schemas/cursor/                     Cursor's official manifest schemas (for validation)
```

Keep the `version` the same in all three `plugin.json` files; `npm run validate` checks it.

## License

MIT
