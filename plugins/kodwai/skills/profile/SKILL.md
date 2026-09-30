---
name: profile
description: The user's kodwai player card and progress. Tier, Direction Elo, level and XP, rank, streak, category mastery, badges held and in progress, daily and weekly quests (and claiming their XP), Wrapped, the README rank card, and anyone's public profile. Use when the user asks about their kodwai stats, badges, quests, streak, XP, tier, or another developer's profile.
argument-hint: "[username | badges | quests | wrapped | card]"
allowed-tools: Bash(npx -y @kodwai/cli@latest *)
---

# kodwai profile and progress

Run these with `npx -y @kodwai/cli@latest <command>`.

| The user wants | Command |
|---|---|
| Their player card: tier, Elo, level, rank, streak, mastery, badges, recent runs | `profile` |
| Someone else's public profile | `profile <username>` |
| Badges held, progress to the next ones, rarity | `badges` (`--all` includes locked ones) |
| Daily and weekly quests | `quests` |
| Bank XP from finished quests | `quests claim all` or `quests claim <key>` |
| Their kodwai Wrapped | `wrapped` |
| A rank card for their GitHub README | `card` (`--theme dark\|light\|signal`) |
| Edit their public profile | `profile edit --bio "..." --github <url> --x <@handle or url> --linkedin <url> --website <url>` |

Read the default output first: it marks the user's own rows ("◀ you") and says plainly when they aren't ranked. Add `--json` only when you need exact fields to compute something; in JSON, `me`/`viewer` is the user, and `me: null` means they aren't on that board.

- Claiming quests only banks XP the user already earned, so do it when they ask for it (or say "claim my quests").
- `profile edit` changes their public page: only run it with values the user gave you, and show them what you'll set first.
- Answer "how do I get badge X / level up / climb a tier" from the numbers: what's missing (for example "2 more challenges for Ten Strong", "142 Elo to Gold").
