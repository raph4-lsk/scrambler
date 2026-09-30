import { beforeAll, describe, expect, it } from 'vitest';
import { stateFromMoves } from '@/puzzles/cube333/moves';
import { parseMoves } from '@/puzzles/cube333/notation';
import { randomState } from '@/puzzles/cube333/random-state';
import { isEqual } from '@/puzzles/cube333/state';
import { seededRandom } from '@/random';
import { prepare, randomScramble, type EventId } from '@/scramble';

beforeAll(() => prepare('333'), 60000);

describe('randomScramble 333', () => {
  it('reaches exactly the randomly drawn state', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const scramble = randomScramble('333', { random: seededRandom(seed) });
      const drawn = randomState(seededRandom(seed));
      expect(isEqual(stateFromMoves(parseMoves(scramble)), drawn)).toBe(true);
    }
  });

  it('writes at most 22 moves in WCA notation', () => {
    for (let seed = 100; seed < 110; seed++) {
      const scramble = randomScramble('333', { random: seededRandom(seed) });
      expect(scramble).toMatch(/^([URFDLB](2|')?)( [URFDLB](2|')?)*$/);
      expect(scramble.split(' ').length).toBeLessThanOrEqual(22);
    }
  });

  it('uses the secure random source by default', () => {
    expect(parseMoves(randomScramble('333')).length).toBeGreaterThan(0);
  });

  it('stays fast once the tables are ready', () => {
    prepare('333');
    const start = Date.now();
    for (let seed = 200; seed < 220; seed++) randomScramble('333', { random: seededRandom(seed) });
    expect((Date.now() - start) / 20).toBeLessThan(500);
  });
});

describe('unsupported events', () => {
  it('throws a clear error', () => {
    expect(() => randomScramble('444' as EventId)).toThrow(/Unsupported event 444/);
    expect(() => prepare('444' as EventId)).toThrow(/Unsupported event 444/);
  });
});
