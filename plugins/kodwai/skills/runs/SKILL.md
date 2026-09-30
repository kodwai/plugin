---
name: runs
description: The user's kodwai runs (submissions). History, one run's full result (score, Direction, Outcome and Lift, moments, what it unlocked, every signal with the judge's evidence), public share links, and rating a challenge. Use when the user asks about their kodwai scores, a past run, why they got a score, how to improve Direction, or wants to share or rate a run.
argument-hint: "[run-id]"
allowed-tools: Bash(npx -y @kodwai/cli@latest *)
---

# kodwai runs

Run these with `npx -y @kodwai/cli@latest <command>`.

| The user wants | Command |
|---|---|
| Their run history | `submissions` (`--challenge <slug> --limit <n> --page <n>`) |
| One run in full (latest, or the current workspace's, if no id) | `result [id]` |
| Every signal with its value, weight, reason and evidence | `result [id] --verbose` |
| A public share link (and X / LinkedIn links) for a scored run | `share [id]` |
| Rate the challenge a run was for | `rate [id] --overall 1-5 [--difficulty 1-5] [--clarity 1-5] [--comment "..."]` |
| Delete a run, or stop one in progress | `delete <id> --yes` |

Read the default output first: it marks the user's own rows ("◀ you") and says plainly when they aren't ranked. Add `--json` only when you need exact fields to compute something; in JSON, `me`/`viewer` is the user, and `me: null` means they aren't on that board.

Explaining a score:
- Direction (how the user steered: spec precision, verification, decomposition, recovery, intent fidelity, staying engaged) carries the most weight. Outcome is tests and code quality, or a challenge's own rubric (shown as "Challenge rubric"). Lift is catching the challenge's traps and beating a solo-AI baseline.
- Use `result --verbose`, and quote the judge's reasons and evidence, not your own guesses. Point at the lowest-value, highest-weight signals: that's where the next points are.
- "Not on the leaderboard" reasons come with the fix (for example, connect a key). Pass it on.

Writes:
- `rate` sends the user's rating: only with numbers and a comment the user gave you.
- `delete` can't be undone and doesn't refund a free run. Only when the user asks for that specific run, after they confirm.
