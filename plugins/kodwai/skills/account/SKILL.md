---
name: account
description: The user's kodwai account. Username, the Anthropic key used for scoring and free runs left, sending feedback to the kodwai team and reading replies, and opening any kodwai page in the browser. Use when the user asks about their kodwai username, API key, free runs, wants to report a bug or idea to kodwai, or open the kodwai site.
argument-hint: "[username | key | feedback | open]"
---

# kodwai account

Run these with `npx -y @kodwai/cli@latest <command>`.

| The user wants | Command |
|---|---|
| Their signed-in account | `whoami` |
| Show or set their username | `username` / `username <name>` |
| Their scoring key and free runs left | `key` |
| Connect an Anthropic key | `key add` (see below) |
| Remove a key | `key remove <id> --yes` |
| Send feedback to the kodwai team | `feedback "<text>" --category bug\|feature\|improvement\|general [--rating 1-5]` |
| Their feedback and the team's replies | `feedback list` |
| Open a page in the browser | `open [challenges\|leaderboard\|league\|events\|sprint\|quests\|badges\|profile\|wrapped\|submissions\|settings\|feedback\|<challenge-slug>]` |
| Sign in or out | `login` / `logout` |

**API keys never go through the chat.** Never ask for the key, and never put one in a command. `key add` asks for it in a hidden terminal prompt. When you run it (no terminal), it opens the settings page in the browser instead, where the user pastes it. Tell them that, or to run `npx @kodwai/cli@latest key add` in their own terminal. If the user pastes a key into the chat anyway, don't use it: tell them to revoke it at console.anthropic.com and add a fresh one through the page.

Writes:
- **Feedback:** draft it, show the user the exact text, and send only after they say yes. The founder reads every message.
- **Username** changes their public URL. Only change it to a name the user chose.
- **Removing a key** can't be undone. Only on the user's request, after they confirm.

Password changes are only on the website (`open settings`).
