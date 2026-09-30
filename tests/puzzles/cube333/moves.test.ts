import { describe, expect, it } from 'vitest';
import {
  applyMoves,
  FACES,
  invertMoves,
  moveState,
  stateFromMoves,
  type Face,
  type Move,
} from '@/puzzles/cube333/moves';
import {
  isEqual,
  isSolved,
  isValid,
  multiply,
  SOLVED,
  type CubeState,
} from '@/puzzles/cube333/state';

const m = (face: Face, amount: 1 | 2 | 3 = 1): Move => ({ face, amount });

/**
 * Counts how many times a sequence must be repeated to return to solved.
 * @param moves - The sequence to repeat.
 * @returns Its order, or Infinity above 2000 repetitions.
 */
function order(moves: Move[]): number {
  const step = stateFromMoves(moves);
  let state: CubeState = step;
  for (let n = 1; n <= 2000; n++) {
    if (isSolved(state)) return n;
    state = multiply(state, step);
  }
  return Infinity;
}

describe('face turns', () => {
  it('gives valid, unsolved states for every move', () => {
    for (const face of FACES) {
      for (const amount of [1, 2, 3] as const) {
        const state = moveState(m(face, amount));
        expect(isValid(state)).toBe(true);
        expect(isSolved(state)).toBe(false);
      }
    }
  });

  it('returns to solved after four quarter turns of any face', () => {
    for (const face of FACES) expect(order([m(face)])).toBe(4);
  });

  it('matches known orders of classic sequences', () => {
    expect(order([m('R'), m('U'), m('R', 3), m('U', 3)])).toBe(6);
    expect(order([m('R'), m('U')])).toBe(105);
    expect(order([m('R', 2), m('U', 2)])).toBe(6);
  });

  it('commutes opposite faces and not adjacent ones', () => {
    expect(isEqual(stateFromMoves([m('U'), m('D')]), stateFromMoves([m('D'), m('U')]))).toBe(true);
    expect(isEqual(stateFromMoves([m('R'), m('L')]), stateFromMoves([m('L'), m('R')]))).toBe(true);
    expect(isEqual(stateFromMoves([m('F'), m('B')]), stateFromMoves([m('B'), m('F')]))).toBe(true);
    expect(isEqual(stateFromMoves([m('R'), m('U')]), stateFromMoves([m('U'), m('R')]))).toBe(false);
  });

  it('flips only the edges of the F and B faces', () => {
    const flipped = (face: Face) => moveState(m(face)).eo.filter((e) => e === 1).length;
    expect(FACES.map(flipped)).toEqual([0, 0, 4, 0, 0, 4]);
  });

  it('flips every edge with the superflip and keeps corners solved', () => {
    const superflip = stateFromMoves(
      'U R2 F B R B2 R U2 L B2 R U3 D3 R2 F R3 L B2 U2 F2'.split(' ').map((token) => {
        const amount = token.length === 1 ? 1 : (Number(token[1]) as 2 | 3);
        return m(token[0] as Face, amount);
      }),
    );
    expect(superflip.eo).toEqual(new Array(12).fill(1));
    expect(superflip.ep).toEqual(SOLVED.ep);
    expect(superflip.cp).toEqual(SOLVED.cp);
    expect(superflip.co).toEqual(SOLVED.co);
  });

  it('rejects an unknown move', () => {
    expect(() => moveState({ face: 'X' as Face, amount: 1 })).toThrow(RangeError);
  });
});

describe('invertMoves', () => {
  it('undoes any sequence', () => {
    const moves = [m('R'), m('U', 2), m('F', 3), m('D'), m('L', 2), m('B', 3)];
    expect(isSolved(applyMoves(stateFromMoves(moves), invertMoves(moves)))).toBe(true);
  });
});
