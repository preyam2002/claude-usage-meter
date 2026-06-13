import { chmod, copyFile, mkdir, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";

export async function installClaudeStatusLine(options = {}) {
  const claudeDir = options.claudeDir ?? join(homedir(), ".claude");
  const sourceScript = options.sourceScript;
  const refreshInterval = options.refreshInterval ?? 60;

  if (!sourceScript) {
    throw new Error("sourceScript is required");
  }

  const installDir = join(claudeDir, "usage-meter");
  const resolvedSourceScript = await realpath(sourceScript);
  const installBinDir = join(installDir, "bin");
  const installSrcDir = join(installDir, "src");
  const sourceRoot = dirname(dirname(resolvedSourceScript));
  const sourceSrcDir = join(sourceRoot, "src");
  const installedScript = join(installBinDir, basename(resolvedSourceScript));
  const settingsPath = join(claudeDir, "settings.json");

  await mkdir(installBinDir, { recursive: true });
  await mkdir(installSrcDir, { recursive: true });
  await copyFile(resolvedSourceScript, installedScript);
  await copySourceModules(sourceSrcDir, installSrcDir);
  await chmod(installedScript, 0o755);

  const settings = await readSettings(settingsPath);
  settings.statusLine = {
    type: "command",
    command: `node ${JSON.stringify(installedScript)}`,
    padding: 1,
    refreshInterval,
  };

  await mkdir(claudeDir, { recursive: true });
  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);

  return {
    settingsPath,
    installedScript,
    command: settings.statusLine.command,
  };
}

async function readSettings(settingsPath) {
  try {
    const raw = await readFile(settingsPath, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

async function copySourceModules(sourceSrcDir, installSrcDir) {
  const entries = await readdir(sourceSrcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".mjs")) {
      await copyFile(join(sourceSrcDir, entry.name), join(installSrcDir, entry.name));
    }
  }
}
