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

  it('reaches a state that meets a constraint', () => {
    const constraint = {
      edges: [
        { piece: 5, position: 0, orientation: 1 },
        { piece: 4, position: 10, orientation: 0 },
      ],
      corners: [{ piece: 7, position: 2, orientation: 1 }],
    };
    for (let seed = 1; seed <= 10; seed++) {
      const state = stateFromMoves(
        parseMoves(randomScramble('333', { random: seededRandom(seed), constraint })),
      );
      expect([state.ep[0], state.eo[0], state.ep[10], state.cp[2], state.co[2]]).toEqual([
        5, 1, 4, 7, 1,
      ]);
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
