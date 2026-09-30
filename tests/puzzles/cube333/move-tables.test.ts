import { describe, expect, it } from 'vitest';
import {
  getCornerPerm,
  getFlip,
  getSlice,
  getSlicePerm,
  getTwist,
  getUDEdgePerm,
} from '@/puzzles/cube333/coordinates';
import {
  getMoveTables,
  MOVE_COUNT,
  MOVES,
  PHASE2_MOVE_COUNT,
  PHASE2_MOVES,
} from '@/puzzles/cube333/move-tables';
import { applyMoves, moveState } from '@/puzzles/cube333/moves';
import { randomState } from '@/puzzles/cube333/random-state';
import { multiply, SOLVED, type CubeState } from '@/puzzles/cube333/state';
import { seededRandom } from '@/random';

const tables = getMoveTables();

describe('move lists', () => {
  it('lists the 18 face turns and the 10 phase 2 moves', () => {
    expect(MOVE_COUNT).toBe(18);
    expect(PHASE2_MOVE_COUNT).toBe(10);
    expect(PHASE2_MOVES.map((i) => `${MOVES[i].face}${MOVES[i].amount}`)).toEqual([
      'U1',
      'U2',
      'U3',
      'R2',
      'F2',
      'D1',
      'D2',
      'D3',
      'L2',
      'B2',
    ]);
  });
});

describe('phase 1 move tables', () => {
  it('match applying each move to random states', () => {
    const random = seededRandom(11);
    for (let n = 0; n < 200; n++) {
      const state = randomState(random);
      MOVES.forEach((move, m) => {
        const next = multiply(state, moveState(move));
        expect(tables.twist[getTwist(state.co) * MOVE_COUNT + m]).toBe(getTwist(next.co));
        expect(tables.flip[getFlip(state.eo) * MOVE_COUNT + m]).toBe(getFlip(next.eo));
        expect(tables.slice[getSlice(state.ep) * MOVE_COUNT + m]).toBe(getSlice(next.ep));
      });
    }
  });
});

describe('phase 2 move tables', () => {
  it('match applying each phase 2 move to states of the phase 2 group', () => {
    const random = seededRandom(12);
    for (let n = 0; n < 200; n++) {
      const path = Array.from({ length: 30 }, () => MOVES[PHASE2_MOVES[random(PHASE2_MOVE_COUNT)]]);
      const state: CubeState = applyMoves(SOLVED, path);
      PHASE2_MOVES.forEach((index, m) => {
        const next = multiply(state, moveState(MOVES[index]));
        const at = (value: number) => value * PHASE2_MOVE_COUNT + m;
        expect(tables.cornerPerm[at(getCornerPerm(state.cp))]).toBe(getCornerPerm(next.cp));
        expect(tables.udEdgePerm[at(getUDEdgePerm(state.ep))]).toBe(getUDEdgePerm(next.ep));
        expect(tables.slicePerm[at(getSlicePerm(state.ep))]).toBe(getSlicePerm(next.ep));
      });
    }
  });

  it('builds the tables only once', () => {
    expect(getMoveTables()).toBe(tables);
  });
});
