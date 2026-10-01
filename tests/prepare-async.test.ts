import { describe, expect, it, vi } from 'vitest';
import type { EventId } from '@/scramble';

describe('prepareAsync 333', () => {
  it('builds exactly the same tables as prepare', async () => {
    vi.resetModules();
    const asyncModule = await import('@/scramble');
    const asyncTables = await import('@/puzzles/cube333/pruning-tables');
    await asyncModule.prepareAsync('333', { yieldToHost: async () => undefined });
    const built = asyncTables.getPruningTables();

    vi.resetModules();
    const syncTables = await import('@/puzzles/cube333/pruning-tables');
    const expected = syncTables.getPruningTables();

    expect(built).not.toBe(expected);
    for (const key of Object.keys(expected) as (keyof typeof expected)[]) {
      expect(built[key]).toEqual(expected[key]);
    }
  }, 60000);

  it('never runs long between two pauses', async () => {
    vi.resetModules();
    const { prepareAsync } = await import('@/scramble');
    let last = Date.now();
    let longest = 0;
    await prepareAsync('333', {
      sliceMs: 0,
      yieldToHost: async () => {
        longest = Math.max(longest, Date.now() - last);
        last = Date.now();
      },
    });
    expect(longest).toBeLessThan(50);
  }, 60000);

  it('makes the next scramble fast', async () => {
    vi.resetModules();
    const { prepareAsync, randomScramble, seededRandom } = await import('@/index');
    await prepareAsync('333');
    expect(randomScramble('333', { random: seededRandom(1) }).split(' ').length).toBeGreaterThan(0);
  }, 60000);

  it('rejects an unsupported event', async () => {
    const { prepareAsync } = await import('@/scramble');
    await expect(prepareAsync('444' as EventId)).rejects.toThrow(/Unsupported event 444/);
  });
});
