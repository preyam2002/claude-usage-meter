---
name: install-claude-usage-meter
description: Install or update the Claude Usage Meter statusline for Claude Code from Codex.
---

# Install Claude Usage Meter

Use this skill when the user wants Codex to install, update, or inspect the Claude Usage Meter statusline for Claude Code.

## How to run

Run:

```bash
npx -y github:preyam2002/claude-usage-meter install
```

Report the printed `settings`, `script`, and `command` paths.

The installer copies a stable runtime to `~/.claude/usage-meter/` and updates `~/.claude/settings.json` with a `statusLine` command. It preserves unrelated settings.

## Verification

After installing, run a smoke test with mock Claude Code statusline input:

```bash
printf '%s\n' '{"model":{"display_name":"Sonnet"},"context_window":{"used_percentage":12},"rate_limits":{"five_hour":{"used_percentage":25,"resets_at":1893459600}}}' | node "$HOME/.claude/usage-meter/bin/claude-usage-meter"
```

The output should include `Sonnet`, `ctx 12%`, and `5h 25%`.

Claude Code only includes `rate_limits` fields for Claude.ai subscribers after the first API response in a session.
