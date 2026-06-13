import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;

test("package is publishable as the public npm distribution channel", async () => {
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));

  assert.equal(packageJson.name, "claude-usage-meter");
  assert.notEqual(packageJson.private, true);
  assert.equal(packageJson.license, "MIT");
  assert.equal(packageJson.repository.type, "git");
  assert.equal(packageJson.repository.url, "git+https://github.com/preyam2002/claude-usage-meter.git");
  assert.equal(packageJson.publishConfig.access, "public");
  assert.equal(packageJson.publishConfig.provenance, true);
  assert.deepEqual(packageJson.files.sort(), [
    ".agents/",
    ".claude-plugin/",
    "PUBLISHING.md",
    "README.md",
    "bin/",
    "plugins/",
    "src/",
  ].sort());
});

test("npx-style install subcommand installs the Claude statusline", async () => {
  const dir = await mkdtemp(join(tmpdir(), "usage-meter-npx-"));
  const claudeDir = join(dir, ".claude");

  try {
    const output = await runCli(["install", "--claude-dir", claudeDir, "--refresh-interval", "30"]);
    const settings = JSON.parse(await readFile(join(claudeDir, "settings.json"), "utf8"));
    const smoke = await runInstalled(join(claudeDir, "usage-meter", "bin", "claude-usage-meter"), {
      CLAUDE_USAGE_METER_STATE: join(claudeDir, "usage-meter", "samples.json"),
    });

    assert.match(output, /Installed Claude Usage Meter statusline/);
    assert.equal(settings.statusLine.refreshInterval, 30);
    assert.match(smoke, /Sonnet/);
    assert.match(smoke, /5h 25%/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("GitHub workflows validate and publish with trusted npm publishing", async () => {
  const ci = await readFile(join(root, ".github", "workflows", "ci.yml"), "utf8");
  const publish = await readFile(join(root, ".github", "workflows", "publish.yml"), "utf8");

  assert.match(ci, /npm run validate/);
  assert.match(publish, /id-token: write/);
  assert.match(publish, /npm publish/);
});

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, "bin", "claude-usage-meter"), ...args], {
      stdio: ["ignore", "pipe", "pipe"],
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
        reject(new Error(`cli exited ${code}: ${stderr || stdout}`));
      }
    });
  });
}

function runInstalled(scriptPath, env) {
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
        reject(new Error(`installed cli exited ${code}: ${stderr || stdout}`));
      }
    });
    child.stdin.end(
      '{"model":{"display_name":"Sonnet"},"context_window":{"used_percentage":12},"rate_limits":{"five_hour":{"used_percentage":25,"resets_at":1893459600}}}\n',
    );
  });
}
