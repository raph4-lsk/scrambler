import { describe, expect, it } from 'vitest';
import { runInSlices, runSync, type Steps } from '@/steps';

/**
 * Counts to a limit, pausing after each number.
 * @param limit - The last number.
 * @returns A generator returning the sum of the numbers.
 */
function* countTo(limit: number): Steps<number> {
  let total = 0;
  for (let n = 1; n <= limit; n++) {
    total += n;
    yield;
  }
  return total;
}

describe('runSync', () => {
  it('runs a generator to the end', () => {
    expect(runSync(countTo(100))).toBe(5050);
  });
});

describe('runInSlices', () => {
  it('returns the same value as runSync', async () => {
    expect(await runInSlices(countTo(100))).toBe(5050);
  });

  it('yields to the host once each slice is used up', async () => {
    let yields = 0;
    const result = await runInSlices(countTo(50), {
      sliceMs: 0,
      yieldToHost: async () => {
        yields++;
      },
    });
    expect(result).toBe(1275);
    expect(yields).toBeGreaterThanOrEqual(50);
  });

  it('works without a timer in the host', async () => {
    const timers = globalThis as { setTimeout?: unknown };
    const original = timers.setTimeout;
    timers.setTimeout = undefined;
    try {
      expect(await runInSlices(countTo(10), { sliceMs: 0 })).toBe(55);
    } finally {
      timers.setTimeout = original;
    }
  });
});
