import { beforeAll, describe, expect, it } from 'vitest';
import { applyMoves, stateFromMoves, type Move } from '@/puzzles/cube333/moves';
import { getPruningTables } from '@/puzzles/cube333/pruning-tables';
import { parseMoves } from '@/puzzles/cube333/notation';
import { randomState } from '@/puzzles/cube333/random-state';
import { DEFAULT_MAX_LENGTH, solve } from '@/puzzles/cube333/search';
import { isSolved, SOLVED } from '@/puzzles/cube333/state';
import { seededRandom } from '@/random';

const OPPOSITE = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' } as const;

/**
 * Tells whether a solution turns the same face twice in a row, or an opposite pair twice.
 * @param moves - The solution to check.
 * @returns True if a move could be merged with a neighbour.
 */
function hasRedundantMoves(moves: Move[]): boolean {
  return moves.some((move, i) => {
    const previous = moves[i - 1];
    const beforePrevious = moves[i - 2];
    if (previous?.face === move.face) return true;
    return previous?.face === OPPOSITE[move.face] && beforePrevious?.face === move.face;
  });
}

beforeAll(() => getPruningTables(), 60000);

describe('solve', () => {
  it('returns no move for the solved cube', () => {
    expect(solve(SOLVED)).toEqual([]);
  });

  it('solves short known sequences', () => {
    for (const text of [
      'R',
      "R U R' U'",
      'F2 B2 U D',
      "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2",
    ]) {
      const state = stateFromMoves(parseMoves(text));
      const solution = solve(state);
      expect(solution).not.toBeNull();
      expect(isSolved(applyMoves(state, solution ?? []))).toBe(true);
    }
  });

  it('solves random states within the length limit, without redundant moves', () => {
    const random = seededRandom(31);
    for (let i = 0; i < 20; i++) {
      const state = randomState(random);
      const solution = solve(state) ?? [];
      expect(isSolved(applyMoves(state, solution))).toBe(true);
      expect(solution.length).toBeLessThanOrEqual(DEFAULT_MAX_LENGTH);
      expect(hasRedundantMoves(solution)).toBe(false);
    }
  });

  it('returns null when no solution fits within the limit', () => {
    expect(solve(stateFromMoves(parseMoves("R U F' L2 D")), 3)).toBeNull();
  });
});
