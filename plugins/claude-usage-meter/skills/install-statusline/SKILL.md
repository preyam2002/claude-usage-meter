---
name: install-statusline
description: Install or update the Claude Usage Meter statusline for Claude Code.
---

# Install Claude Usage Meter

Use this skill when the user wants to enable the Claude Usage Meter statusline.

Run this command from Claude Code:

```bash
npx -y github:preyam2002/claude-usage-meter install
```

Then tell the user:

- It copied the statusline runtime to `~/.claude/usage-meter/`.
- It updated `~/.claude/settings.json` with a `statusLine` command.
- The statusline appears after the next Claude Code interaction, or after restarting Claude Code.

The statusline uses Claude Code's `rate_limits` statusline fields when present. Those fields are only available for Claude.ai Pro/Max subscribers after the first API response in a session.
