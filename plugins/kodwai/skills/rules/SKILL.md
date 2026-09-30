---
name: rules
description: What to do while a kodwai challenge is in progress. Use when working inside a kodwai challenge workspace, a folder (or a parent) containing .kodwai/submission.json or a kodwai PROBLEM.md.
user-invocable: false
---

# Working inside a kodwai challenge

kodwai is where developers prove they can drive an AI agent. The user solves a real challenge on their own machine with you, then submits the session. kodwai scores three axes:

- **Direction**: how well the user steers you (specs, redirects, catching mistakes). It carries the most weight.
- **Outcome**: whether the result works (tests, rubric).
- **Lift**: whether the user catches the traps the challenge hides.

The session transcript is part of the submission. So inside a challenge workspace:

- **The user leads.** Follow their direction. Don't solve ahead of what they asked for.
- **Stay in the workspace.** Keep edits and commands inside the `kodwai-<slug>/` folder.
- **Leave kodwai's files alone.** Don't edit or delete `.kodwai/`. Don't edit or delete the provided tests to make them pass unless the user explicitly asks. Don't rewrite git history: the starter commit is the baseline the diff is taken against.
- **Never submit or abandon on your own.** Those are `/kodwai:submit` and `/kodwai:abandon`, run by the user. A challenge can be submitted only once.
- **Time is visible.** `npx -y @kodwai/cli@latest status` shows time left if the user asks.
- **Platform lookups are fine, but they're in the transcript too.** Leaderboards, profile, quests and the rest work mid-challenge (see the other kodwai skills). Keep them short and only when the user asks.
