---
name: challenges
description: Browse kodwai challenges, see one challenge's spec, rubric and top 10, today's Challenge of the Day, the weekly sprint and events. Use when the user asks what kodwai challenges exist, which to try, what the daily or sprint is, how a challenge is scored, or about kodwai events.
argument-hint: "[search | slug | daily | sprint | events]"
---

# Discover kodwai challenges

Run these with `npx @kodwai/cli@1.10.0 <command>`. Public commands work signed out; `daily` and `sprint` sign the user in through the browser if needed.

| The user wants | Command |
|---|---|
| The catalog (their best score shows on ones they solved) | `challenges` |
| Filtered | `challenges --search <text> --difficulty easy\|medium\|hard --category <name> --sort newest\|popular\|difficulty --limit <n> --page <n>` |
| The categories | `challenges categories` |
| One challenge: spec, how it's scored, their runs, top 10 | `info <slug>` (add `--verbose` for every signal and its weight) |
| Challenge of the Day, and whether they cleared it | `daily` |
| This week's sprint and standings | `sprint` |
| Events, or one event's board | `events` / `events <slug>` |

Read the default output first: it marks the user's own rows ("◀ you") and says plainly when they aren't ranked. Add `--json` only when you need exact fields to compute something; in JSON, `me`/`viewer` is the user, and `me: null` means they aren't on that board.

Recommending a challenge: weigh their level (`profile`), what they haven't solved yet, and the time they have. Give the slug, level, time limit and one line on why. To start one, the user runs `/kodwai:challenge <slug>`. Don't start it yourself.

Never guess at a challenge's hidden traps or problem statement: they're revealed only when the challenge starts.
