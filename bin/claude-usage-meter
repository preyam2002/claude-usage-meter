#!/usr/bin/env node

const thisFile = process.argv[1];
const { installClaudeStatusLine } = await import("../src/install-statusline.mjs");
const { buildStatusLine, defaultStatePath, readStatusLineInput } = await import("../src/usage-meter.mjs");

try {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
  } else if (shouldInstall()) {
    const result = await installClaudeStatusLine({
      sourceScript: thisFile,
      refreshInterval: readRefreshInterval(),
      claudeDir: readOption("--claude-dir"),
    });
    console.log(`Installed Claude Usage Meter statusline`);
    console.log(`settings: ${result.settingsPath}`);
    console.log(`script: ${result.installedScript}`);
    console.log(`command: ${result.command}`);
  } else {
    const input = await readStatusLineInput();
    const line = await buildStatusLine(input, {
      statePath: process.env.CLAUDE_USAGE_METER_STATE ?? defaultStatePath(),
      timeZone: process.env.TZ,
    });
    console.log(line);
  }
} catch (error) {
  if (process.argv.includes("--debug")) {
    console.error(error);
  }
  console.log("Claude | usage meter unavailable");
  process.exitCode = shouldInstall() ? 1 : 0;
}

function readRefreshInterval() {
  const value = Number(readOption("--refresh-interval"));
  return Number.isFinite(value) && value >= 1 ? value : 60;
}

function shouldInstall() {
  return process.argv.includes("--install") || process.argv[2] === "install";
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function printHelp() {
  console.log(`Claude Usage Meter

Usage:
  claude-usage-meter install [--refresh-interval 60]
  claude-usage-meter

Examples:
  npx claude-usage-meter@latest install
  printf '%s\\n' '{"model":{"display_name":"Sonnet"}}' | claude-usage-meter
`);
}
