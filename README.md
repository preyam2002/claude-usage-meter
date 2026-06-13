# Claude Usage Meter

Claude Usage Meter is a Claude Code statusline that shows current rate-limit usage, reset time, and a projected cap time if the recent usage pattern continues.

## Install

The simplest install path is npm:

```bash
npx claude-usage-meter@latest install
```

This copies a stable runtime into `~/.claude/usage-meter/` and updates `~/.claude/settings.json` with a `statusLine` command.

## Claude Plugin

This repository also ships a Claude Code marketplace for discovery:

```text
/plugin marketplace add preyam2002/claude-usage-meter
/plugin install claude-usage-meter@claude-usage-meter
/claude-usage-meter:install-statusline
```

The plugin install skill delegates to the same npm installer.

## Codex Plugin

Codex users can install the companion plugin from the repository marketplace:

```bash
codex plugin marketplace add preyam2002/claude-usage-meter
codex plugin add codex-claude-usage-meter@claude-usage-meter-codex
```

Then use the `install-claude-usage-meter` skill. The Codex plugin can also be shared from the Codex app under Plugins -> Created by you -> Share.

## What It Displays

Example:

```text
Opus | ctx 11% | 5h 50% reset 02:00 cap 01:20 | 7d 9% reset Tue
```

`cap` is a forecast from recent local samples, not an Anthropic guarantee. Reset times and used percentages come from Claude Code's statusline input.

## Development

```bash
npm test
npm run validate
```

## Publishing

The npm package name `claude-usage-meter` was available when checked on June 13, 2026. This repo is configured for public npm publishing with provenance:

1. Push this repository to `github.com/preyam2002/claude-usage-meter`.
2. On npmjs.com, create or claim `claude-usage-meter`.
3. Configure npm Trusted Publisher for GitHub Actions:
   - owner: `preyam2002`
   - repository: `claude-usage-meter`
   - workflow: `publish.yml`
4. Create a GitHub release or run the Publish workflow.

Trusted publishing avoids long-lived npm tokens and uses GitHub Actions OIDC.
