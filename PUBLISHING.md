# Publishing

The simplest public distribution path is npm first, marketplaces second:

```bash
npx claude-usage-meter@latest install
```

Until npm is live, users can install directly from GitHub:

```bash
npx -y github:preyam2002/claude-usage-meter install
```

The npm command is the target primary user experience because Claude Code plugins cannot currently auto-configure the main `statusLine` setting. The Claude and Codex plugins in this repository exist for discovery, setup help, and workspace sharing.

## Channels

1. npm package: `claude-usage-meter`
   - Best for everyone.
   - One command install.
   - Works outside Claude/Codex plugin UX.

2. GitHub source install
   - Works immediately after the public repo exists.
   - Command: `npx -y github:preyam2002/claude-usage-meter install`.
   - Slightly less elegant than npm, but public today.

3. GitHub repository marketplace
   - Claude: `/plugin marketplace add preyam2002/claude-usage-meter`
   - Codex: `codex plugin marketplace add preyam2002/claude-usage-meter`
   - Good for users who browse plugins from the CLI/app.

4. Codex app sharing
   - Good for workspace members.
   - Does not publish publicly.

5. Claude community marketplace
   - Best long-term public discovery path after review.
   - Submit after the npm package and GitHub repo are live.

## Release Steps

1. Push the repository to `github.com/preyam2002/claude-usage-meter`.
2. Publish the first npm version or configure trusted publishing.
3. On npmjs.com, configure Trusted Publisher:
   - Provider: GitHub Actions
   - Owner: `preyam2002`
   - Repository: `claude-usage-meter`
   - Workflow file: `publish.yml`
4. Create a GitHub release for `v0.1.0` or run the Publish workflow manually.
5. Verify:

```bash
npx claude-usage-meter@latest install
```

Until npm is live, verify from GitHub:

```bash
npx -y github:preyam2002/claude-usage-meter install
```

## Source Notes

- Claude Code marketplaces are GitHub-hosted catalogs that users add with `/plugin marketplace add`.
- Codex supports repo marketplaces and workspace sharing from the Codex app.
- npm Trusted Publishing uses GitHub Actions OIDC and avoids long-lived npm tokens.
