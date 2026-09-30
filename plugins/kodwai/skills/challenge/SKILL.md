---
name: challenge
description: Start a kodwai challenge in the current folder. Only when the user runs it.
argument-hint: <challenge-slug>
disable-model-invocation: true
---

# Start a kodwai challenge

The user wants to start a kodwai challenge. The slug is the argument they gave (for example `rate-limiter`).

1. **No slug given?** Tell the user to pick one at https://app.kodwai.com/dev/challenges and run this again with its slug. Stop there.

2. **Start it** from the current folder:

   ```
   npx -y @kodwai/cli@latest challenge <slug> --agent <agent>
   ```

   `<agent>` is the agent you are: `claude-code` in Claude Code, `codex` in Codex, `cursor` in Cursor.
   Give the command up to 10 minutes: the first run opens the browser for sign in.
   It needs network access to api.kodwai.com and writes its sign-in to `~/.kodwai`. If a sandbox blocks that, tell the user and let them approve it for this command.

3. **If it stops early**, tell the user what happened in one or two sentences:
   - *Data collection notice.* Show the user the notice from the output (what is collected, what is not) and ask whether they accept it. Only if they say yes, run the same command again with `--accept-data-notice` added. Never accept it for them.
   - *Sign in.* A browser tab opened. Ask the user to approve it there; the command continues on its own.
   - *A challenge is already in progress.* Say which one. They can finish it with `/kodwai:submit` or drop it with `/kodwai:abandon`. Do neither unless they ask.
   - *Out of free submissions.* Pass on the message: they can connect their own Anthropic API key in Settings.

4. **When it succeeds**, the CLI has created a `kodwai-<slug>/` folder with `PROBLEM.md`, starter files, tests and a git repo, and the clock is running. Tell the user:
   - the workspace folder and the time limit,
   - that everything from now on happens inside that folder (run shell commands from it, edit files in it),
   - `/kodwai:status` shows time left, `/kodwai:submit` submits when they are done.

5. **Then stop and wait for the user.** Do not read ahead, plan or start solving on your own. kodwai scores how the user directs you (Direction), so the user leads from here.
