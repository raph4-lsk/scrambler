import { describe, expect, it } from 'vitest';
import {
  inverse,
  isEqual,
  isSolved,
  isValid,
  multiply,
  permutationParity,
  SOLVED,
  type CubeState,
} from '@/puzzles/cube333/state';

const cornerCycle: CubeState = {
  ...SOLVED,
  cp: [1, 2, 0, 3, 4, 5, 6, 7],
  co: [1, 2, 0, 0, 0, 0, 0, 0],
};

const doubleSwap: CubeState = {
  cp: [1, 0, 2, 3, 4, 5, 6, 7],
  co: [0, 0, 0, 0, 0, 0, 0, 0],
  ep: [1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  eo: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

describe('multiply', () => {
  it('keeps a state unchanged when composed with the solved state', () => {
    expect(isEqual(multiply(cornerCycle, SOLVED), cornerCycle)).toBe(true);
    expect(isEqual(multiply(SOLVED, cornerCycle), cornerCycle)).toBe(true);
  });

  it('returns to solved after three corner cycles', () => {
    const twice = multiply(cornerCycle, cornerCycle);
    expect(isSolved(twice)).toBe(false);
    expect(isSolved(multiply(twice, cornerCycle))).toBe(true);
  });
});

describe('inverse', () => {
  it('undoes a state from both sides', () => {
    for (const state of [cornerCycle, doubleSwap]) {
      expect(isSolved(multiply(state, inverse(state)))).toBe(true);
      expect(isSolved(multiply(inverse(state), state))).toBe(true);
    }
  });
});

describe('isValid', () => {
  it('accepts reachable states', () => {
    expect(isValid(SOLVED)).toBe(true);
    expect(isValid(cornerCycle)).toBe(true);
    expect(isValid(doubleSwap)).toBe(true);
  });

  it('rejects a single twisted corner', () => {
    expect(isValid({ ...SOLVED, co: [1, 0, 0, 0, 0, 0, 0, 0] })).toBe(false);
  });

  it('rejects a single flipped edge', () => {
    expect(isValid({ ...SOLVED, eo: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] })).toBe(false);
  });

  it('rejects a lone corner swap, whose parity differs from the edges', () => {
    expect(isValid({ ...SOLVED, cp: [1, 0, 2, 3, 4, 5, 6, 7] })).toBe(false);
  });

  it('rejects arrays that are not permutations or orientations', () => {
    expect(isValid({ ...SOLVED, cp: [0, 0, 2, 3, 4, 5, 6, 7] })).toBe(false);
    expect(isValid({ ...SOLVED, ep: [0, 1, 2] })).toBe(false);
    expect(isValid({ ...SOLVED, co: [3, 0, 0, 0, 0, 0, 0, 0] })).toBe(false);
    expect(isValid({ ...SOLVED, eo: [0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] })).toBe(false);
  });
});

describe('permutationParity', () => {
  it('counts inversions modulo two', () => {
    expect(permutationParity([0, 1, 2, 3])).toBe(0);
    expect(permutationParity([1, 0, 2, 3])).toBe(1);
    expect(permutationParity([1, 2, 0, 3])).toBe(0);
  });
});
