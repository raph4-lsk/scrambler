import { describe, expect, it } from 'vitest';
import {
  getCornerPerm,
  getFlip,
  getSlice,
  getSlicePerm,
  getTwist,
  getUDEdgePerm,
  TWIST_COUNT,
  FLIP_COUNT,
  CORNER_PERM_COUNT,
  UD_EDGE_PERM_COUNT,
} from '@/puzzles/cube333/coordinates';
import { MOVES, PHASE2_MOVE_COUNT, PHASE2_MOVES } from '@/puzzles/cube333/move-tables';
import { stateFromMoves } from '@/puzzles/cube333/moves';
import { GOAL_SLICE, getPruningTables } from '@/puzzles/cube333/pruning-tables';
import { seededRandom } from '@/random';

const tables = getPruningTables();

/**
 * Returns the phase 1 lower bound of a state.
 * @param moveIndices - Moves applied to the solved cube.
 * @returns The largest of the two phase 1 table values.
 */
function phase1Bound(moveIndices: number[]): number {
  const state = stateFromMoves(moveIndices.map((i) => MOVES[i]));
  const slice = getSlice(state.ep);
  return Math.max(
    tables.sliceTwist[slice * TWIST_COUNT + getTwist(state.co)],
    tables.sliceFlip[slice * FLIP_COUNT + getFlip(state.eo)],
  );
}

/**
 * Returns the phase 2 lower bound of a state of the phase 2 group.
 * @param moveIndices - Phase 2 moves applied to the solved cube.
 * @returns The largest of the two phase 2 table values.
 */
function phase2Bound(moveIndices: number[]): number {
  const state = stateFromMoves(moveIndices.map((i) => MOVES[i]));
  const slicePerm = getSlicePerm(state.ep);
  return Math.max(
    tables.sliceCornerPerm[slicePerm * CORNER_PERM_COUNT + getCornerPerm(state.cp)],
    tables.sliceUDEdgePerm[slicePerm * UD_EDGE_PERM_COUNT + getUDEdgePerm(state.ep)],
  );
}

describe('pruning tables', () => {
  it('reach every entry', () => {
    for (const table of Object.values(tables)) expect(table.includes(255)).toBe(false);
  });

  it('give zero at the goal', () => {
    expect(tables.sliceTwist[GOAL_SLICE * TWIST_COUNT]).toBe(0);
    expect(tables.sliceFlip[GOAL_SLICE * FLIP_COUNT]).toBe(0);
    expect(tables.sliceCornerPerm[0]).toBe(0);
    expect(tables.sliceUDEdgePerm[0]).toBe(0);
  });

  it('never overestimate the number of moves in phase 1', () => {
    const random = seededRandom(21);
    for (let n = 0; n < 300; n++) {
      const length = 1 + random(12);
      const path = Array.from({ length }, () => random(MOVES.length));
      expect(phase1Bound(path)).toBeLessThanOrEqual(length);
    }
  });

  it('never overestimate the number of moves in phase 2', () => {
    const random = seededRandom(22);
    for (let n = 0; n < 300; n++) {
      const length = 1 + random(18);
      const path = Array.from({ length }, () => PHASE2_MOVES[random(PHASE2_MOVE_COUNT)]);
      expect(phase2Bound(path)).toBeLessThanOrEqual(length);
    }
  });

  it('builds the tables only once', () => {
    expect(getPruningTables()).toBe(tables);
  });
});
