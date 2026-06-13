import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";

import { installClaudeStatusLine } from "../src/install-statusline.mjs";

test("installs a stable statusline script and preserves existing Claude settings", async () => {
  const dir = await mkdtemp(join(tmpdir(), "usage-meter-install-"));
  const claudeDir = join(dir, ".claude");
  const sourceRoot = join(dir, "source");
  const sourceScript = join(sourceRoot, "bin", "claude-usage-meter.mjs");

  try {
    await mkdir(claudeDir, { recursive: true });
    await mkdir(join(sourceRoot, "bin"), { recursive: true });
    await mkdir(join(sourceRoot, "src"), { recursive: true });
    await writeFile(
      sourceScript,
      "#!/usr/bin/env node\nimport '../src/usage-meter.mjs';\nconsole.log('ok');\n",
    );
    await writeFile(join(sourceRoot, "src", "usage-meter.mjs"), "export default true;\n");
    await writeFile(
      join(claudeDir, "settings.json"),
      JSON.stringify({ permissions: { allow: ["Bash(npm test)"] } }, null, 2),
    );

    const result = await installClaudeStatusLine({
      claudeDir,
      sourceScript,
      refreshInterval: 45,
    });

    const settings = JSON.parse(await readFile(join(claudeDir, "settings.json"), "utf8"));
    const installedScript = await readFile(result.installedScript, "utf8");

    assert.equal(
      installedScript,
      "#!/usr/bin/env node\nimport '../src/usage-meter.mjs';\nconsole.log('ok');\n",
    );
    assert.equal(
      await readFile(join(claudeDir, "usage-meter", "src", "usage-meter.mjs"), "utf8"),
      "export default true;\n",
    );
    assert.deepEqual(settings.permissions, { allow: ["Bash(npm test)"] });
    assert.equal(settings.statusLine.type, "command");
    assert.match(settings.statusLine.command, /claude-usage-meter\.mjs/);
    assert.equal(settings.statusLine.refreshInterval, 45);
    assert.equal(settings.statusLine.padding, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("installed statusline script executes from the stable Claude directory", async () => {
  const dir = await mkdtemp(join(tmpdir(), "usage-meter-exec-"));
  const claudeDir = join(dir, ".claude");
  const sourceScript = join(new URL("..", import.meta.url).pathname, "bin", "claude-usage-meter.mjs");

  try {
    const result = await installClaudeStatusLine({
      claudeDir,
      sourceScript,
      refreshInterval: 45,
    });
    const output = await runNode(
      result.installedScript,
      {
        model: { display_name: "Sonnet" },
        context_window: { used_percentage: 12 },
        rate_limits: {
          five_hour: { used_percentage: 25, resets_at: 1_893_459_600 },
        },
      },
      {
        CLAUDE_USAGE_METER_STATE: join(claudeDir, "usage-meter", "samples.json"),
      },
    );

    assert.match(output, /Sonnet/);
    assert.match(output, /ctx 12%/);
    assert.match(output, /5h 25%/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function runNode(scriptPath, input, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        ...env,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`node exited ${code}: ${stderr}`));
      }
    });
    child.stdin.end(`${JSON.stringify(input)}\n`);
  });
}
