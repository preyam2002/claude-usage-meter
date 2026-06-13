import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const WINDOWS = [
  ["five_hour", "5h"],
  ["seven_day", "7d"],
];

export function defaultState() {
  return {
    version: 1,
    windows: {
      five_hour: [],
      seven_day: [],
    },
  };
}

export function defaultStatePath() {
  return join(homedir(), ".claude", "usage-meter", "samples.json");
}

export async function readStatusLineInput(stdin = process.stdin) {
  let raw = "";
  for await (const chunk of stdin) {
    raw += chunk;
  }
  return raw.trim() ? JSON.parse(raw) : {};
}

export async function recordRateLimitSamples(input, options = {}) {
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const statePath = options.statePath;
  const state = normalizeState(options.state ?? (statePath ? await readState(statePath) : defaultState()));
  let changed = false;

  for (const [key] of WINDOWS) {
    const rateLimit = input?.rate_limits?.[key];
    const used = finiteNumber(rateLimit?.used_percentage);
    const resetsAt = finiteNumber(rateLimit?.resets_at);
    const current = state.windows[key] ?? [];

    if (used === null || resetsAt === null) {
      state.windows[key] = current.filter((sample) => nowSeconds - sample.t <= maxAgeSeconds(key));
      continue;
    }

    const samples = current
      .filter((sample) => sample.resets_at === resetsAt)
      .filter((sample) => nowSeconds - sample.t <= maxAgeSeconds(key))
      .filter((sample) => sample.t !== nowSeconds);

    samples.push({
      t: nowSeconds,
      used: clamp(used, 0, 100),
      resets_at: resetsAt,
    });

    state.windows[key] = samples.slice(-80);
    changed = true;
  }

  if (changed && statePath) {
    await writeState(statePath, state);
  }

  return state;
}

export async function buildStatusLine(input, options = {}) {
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const timeZone = options.timeZone;
  const state = await recordRateLimitSamples(input, {
    nowSeconds,
    statePath: options.statePath,
    state: options.state,
  });

  const model = input?.model?.display_name ?? input?.model?.id ?? "Claude";
  const context = finiteNumber(input?.context_window?.used_percentage);
  const parts = [`${model}`, `ctx ${context === null ? "--" : `${Math.round(context)}%`}`];
  const limitParts = [];

  for (const [key, label] of WINDOWS) {
    const rateLimit = input?.rate_limits?.[key];
    const used = finiteNumber(rateLimit?.used_percentage);
    const resetsAt = finiteNumber(rateLimit?.resets_at);

    if (used === null) {
      continue;
    }

    const segment = [`${label} ${Math.round(used)}%`];
    if (resetsAt !== null) {
      segment.push(`reset ${formatTime(resetsAt, timeZone)}`);
      const forecast = forecastExhaustion(state.windows[key] ?? [], {
        nowSeconds,
        used,
        resetsAt,
      });
      if (forecast.kind === "before-reset") {
        segment.push(`cap ${formatTime(forecast.at, timeZone)}`);
      } else if (forecast.kind === "after-reset") {
        segment.push("cap after reset");
      }
    }
    limitParts.push(segment.join(" "));
  }

  parts.push(limitParts.length ? limitParts.join(" | ") : "limits --");
  return parts.join(" | ");
}

export function forecastExhaustion(samples, { nowSeconds, used, resetsAt }) {
  const usable = samples
    .filter((sample) => sample.resets_at === resetsAt)
    .filter((sample) => sample.t <= nowSeconds)
    .sort((a, b) => a.t - b.t);

  if (usable.length < 2 || used >= 100) {
    return { kind: "none" };
  }

  const first = usable[0];
  const last = usable[usable.length - 1];
  const elapsed = last.t - first.t;
  const consumed = last.used - first.used;

  if (elapsed < 60 || consumed <= 0) {
    return { kind: "none" };
  }

  const secondsPerPercent = elapsed / consumed;
  const at = nowSeconds + (100 - used) * secondsPerPercent;

  if (!Number.isFinite(at)) {
    return { kind: "none" };
  }

  if (at < resetsAt) {
    return { kind: "before-reset", at: Math.round(at) };
  }

  return { kind: "after-reset", at: Math.round(at) };
}

function normalizeState(state) {
  return {
    version: 1,
    windows: {
      five_hour: Array.isArray(state?.windows?.five_hour) ? state.windows.five_hour : [],
      seven_day: Array.isArray(state?.windows?.seven_day) ? state.windows.seven_day : [],
    },
  };
}

async function readState(statePath) {
  try {
    return JSON.parse(await readFile(statePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      return defaultState();
    }
    throw error;
  }
}

async function writeState(statePath, state) {
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function maxAgeSeconds(key) {
  return key === "seven_day" ? 8 * 24 * 60 * 60 : 6 * 60 * 60;
}

function formatTime(epochSeconds, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
  return formatter.format(new Date(epochSeconds * 1000));
}
