---
name: leaderboard
description: kodwai standings. The all-time leaderboard with filters, one challenge's board, the user's rank on each challenge, and their weekly league (division, rank, promotion and demotion zones). Use when the user asks where they rank, who's on top, how their league is going, or to compare agents or models on kodwai.
argument-hint: "[slug | me | league]"
---

# kodwai standings

Run these with `npx @kodwai/cli@1.10.0 <command>`.

| The user wants | Command |
|---|---|
| All-time board, with their rank pinned | `leaderboard` |
| Filtered by agent, model or category | `leaderboard --agent claude-code\|cursor\|codex --model <slug> --category <name> --page <n>` |
| Valid `--model` and `--category` values | `leaderboard filters` |
| One challenge's board | `leaderboard <challenge-slug>` |
| Their best score on each ranked challenge | `leaderboard me` |
| Their weekly league: division, rank, zones, last week | `league` |
| An event's board | `events <slug>` |

Read the default output first: it marks the user's own rows ("◀ you") and says plainly when they aren't ranked. Add `--json` only when you need exact fields to compute something; in JSON, `me`/`viewer` is the user, and `me: null` means they aren't on that board.

How it works, so you can explain it:
- The all-time board ranks developers by a difficulty-weighted average of their best scores. Tiers come from the Direction Elo: Bronze, Silver 1000, Gold 1150, Platinum 1300, Diamond 1450, Master 1600, Grandmaster 1800.
- Leagues are weekly cohorts of up to 30 across six divisions (Bronze to Master). Points are the week's best score per challenge, x1 easy, x1.5 medium, x2 hard. The top 5 go up and the bottom 5 go down, once a cohort has 10 players. Weeks reset Monday 00:00 UTC.
- There's no weekly or monthly filter on the all-time board. For "this week", use `league` or `sprint`.

Report the numbers straight: rank, points and the gap to the next zone. No cheerleading.
