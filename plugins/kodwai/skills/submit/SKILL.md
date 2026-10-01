---
name: submit
description: Submit the kodwai challenge in progress and show the score. Only when the user runs it.
disable-model-invocation: true
---

# Submit a kodwai challenge

A challenge can be submitted only once, so confirm before sending.

1. **Find the workspace.** It is the current folder, or the `kodwai-*` folder in it, that contains `.kodwai/submission.json`. Run every command below from inside it.

2. **Show where things stand:**

   ```
   npx @kodwai/cli@1.10.0 status
   ```

   Tell the user the time used and the files that will be sent, in two or three lines.

3. **Confirm.** Ask: "Submit now? You can only submit once." Wait for a yes. Skip this only if the user already said to submit without asking (for example `/kodwai:submit now`).

4. **Submit:**

   ```
   npx @kodwai/cli@1.10.0 submit --yes
   ```

   It runs the tests, uploads the code, git history, test results and this session's transcript, then waits for the score. Give it up to 10 minutes. If your shell tool can't wait that long, add `--no-wait` and run `status` again in a minute. It needs network access to api.kodwai.com. If a sandbox blocks it, tell the user and let them approve network access for this command.

5. **Report the result** as the CLI printed it: the total, Direction, Outcome and Lift, and the results link. Keep it to the numbers. Don't argue with the score or add praise.

If the CLI says the challenge was already submitted, just show the score it prints.
