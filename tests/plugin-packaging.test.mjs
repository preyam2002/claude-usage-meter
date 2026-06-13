import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;

test("ships Claude and Codex plugin marketplaces with installer skills", async () => {
  const claudeMarketplace = JSON.parse(
    await readFile(join(root, ".claude-plugin", "marketplace.json"), "utf8"),
  );
  const claudeManifest = JSON.parse(
    await readFile(
      join(root, "plugins", "claude-usage-meter", ".claude-plugin", "plugin.json"),
      "utf8",
    ),
  );
  const codexMarketplace = JSON.parse(
    await readFile(join(root, ".agents", "plugins", "marketplace.json"), "utf8"),
  );
  const codexManifest = JSON.parse(
    await readFile(
      join(root, "plugins", "codex-claude-usage-meter", ".codex-plugin", "plugin.json"),
      "utf8",
    ),
  );

  assert.equal(claudeMarketplace.name, "claude-usage-meter");
  assert.deepEqual(claudeMarketplace.plugins.map((plugin) => plugin.name), [
    "claude-usage-meter",
  ]);
  assert.equal(claudeMarketplace.plugins[0].source, "./plugins/claude-usage-meter");
  assert.equal(claudeManifest.name, "claude-usage-meter");
  assert.equal(claudeManifest.skills, "./skills/");

  assert.equal(codexMarketplace.name, "claude-usage-meter-codex");
  assert.equal(codexMarketplace.plugins[0].name, "codex-claude-usage-meter");
  assert.equal(codexMarketplace.plugins[0].source.path, "./plugins/codex-claude-usage-meter");
  assert.equal(codexManifest.name, "codex-claude-usage-meter");
  assert.equal(codexManifest.skills, "./skills/");

  await access(join(root, "plugins", "claude-usage-meter", "bin", "claude-usage-meter.mjs"));
  await access(
    join(
      root,
      "plugins",
      "claude-usage-meter",
      "skills",
      "install-statusline",
      "SKILL.md",
    ),
  );
  await access(
    join(
      root,
      "plugins",
      "codex-claude-usage-meter",
      "skills",
      "install-claude-usage-meter",
      "SKILL.md",
    ),
  );
});
