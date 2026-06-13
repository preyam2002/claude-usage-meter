import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildStatusLine,
  defaultState,
  recordRateLimitSamples,
} from "../src/usage-meter.mjs";

test("records samples and forecasts cap before reset when current rate would exhaust the 5h window", async () => {
  const dir = await mkdtemp(join(tmpdir(), "usage-meter-"));
  const statePath = join(dir, "samples.json");
  const firstAt = 1_767_225_600;
  const secondAt = firstAt + 1_800;
  const resetAt = firstAt + 7_200;

  try {
    const first = {
      model: { display_name: "Opus" },
      context_window: { used_percentage: 11 },
      rate_limits: {
        five_hour: { used_percentage: 20, resets_at: resetAt },
        seven_day: { used_percentage: 8, resets_at: resetAt + 604_800 },
      },
    };

    const second = {
      ...first,
      rate_limits: {
        five_hour: { used_percentage: 50, resets_at: resetAt },
        seven_day: { used_percentage: 8.5, resets_at: resetAt + 604_800 },
      },
    };

    await recordRateLimitSamples(first, {
      nowSeconds: firstAt,
      statePath,
    });
    await recordRateLimitSamples(second, {
      nowSeconds: secondAt,
      statePath,
    });

    const line = await buildStatusLine(second, {
      nowSeconds: secondAt,
      statePath,
      timeZone: "UTC",
    });

    assert.match(line, /Opus/);
    assert.match(line, /ctx 11%/);
    assert.match(line, /5h 50%/);
    assert.match(line, /reset 02:00/);
    assert.match(line, /cap 01:20/);
    assert.match(line, /7d 9%/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("handles missing rate limit fields without writing samples", async () => {
  const input = {
    model: { display_name: "Sonnet" },
    context_window: { used_percentage: null },
  };

  const state = await recordRateLimitSamples(input, {
    nowSeconds: 1_700_000_000,
    state: defaultState(),
  });
  const line = await buildStatusLine(input, {
    nowSeconds: 1_700_000_000,
    state,
    timeZone: "UTC",
  });

  assert.deepEqual(state.windows.five_hour, []);
  assert.deepEqual(state.windows.seven_day, []);
  assert.equal(line, "Sonnet | ctx -- | limits --");
});
