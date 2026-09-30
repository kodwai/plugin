---
name: abandon
description: Drop the kodwai challenge in progress without scoring it. Only when the user runs it.
disable-model-invocation: true
---

# Abandon a kodwai challenge

This stops the challenge in progress without a score, so the user can start another. Local files are left alone and no free submission is used.

1. Ask: "Drop this challenge without a score?" Wait for a yes. Skip this only if the user already said so in the same message.
2. Run from the workspace (or anywhere):

   ```
   npx -y @kodwai/cli@latest abandon --yes
   ```

   It needs network access to api.kodwai.com. If a sandbox blocks it, tell the user and let them approve network access for this command.
3. Tell the user it's dropped, and that `/kodwai:challenge <slug>` starts a new one.
