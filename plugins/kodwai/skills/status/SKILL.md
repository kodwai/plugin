---
name: status
description: Show time left and files so far for the kodwai challenge in progress, or its score once submitted. Use when the user asks about their kodwai challenge, time left or score.
---

# kodwai status

Run this from the challenge workspace (the folder, or the `kodwai-*` folder inside it, that contains `.kodwai/submission.json`). Outside a workspace it shows the signed-in account and any challenge in progress.

```
npx @kodwai/cli@1.10.0 status
```

Report it in two or three lines: time used and left (or the score, if it's already submitted) and the file count. It needs network access to api.kodwai.com. If a sandbox blocks it, tell the user and let them approve network access for this command. Never submit or abandon from here.
