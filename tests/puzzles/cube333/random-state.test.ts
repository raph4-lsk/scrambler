import { describe, expect, it } from 'vitest';
import {
  constrainedState,
  randomState,
  type StateConstraint,
} from '@/puzzles/cube333/random-state';
import { isEqual, isValid, permutationParity } from '@/puzzles/cube333/state';
import { cryptoRandom, seededRandom } from '@/random';

const SAMPLES = 24000;

/**
 * Computes the chi-square statistic of observed counts against a uniform distribution.
 * @param counts - How many times each value was drawn.
 * @returns The chi-square value.
 */
function chiSquare(counts: number[]): number {
  const total = counts.reduce((sum, c) => sum + c, 0);
  const expected = total / counts.length;
  return counts.reduce((sum, c) => sum + (c - expected) ** 2 / expected, 0);
}

describe('randomState', () => {
  it('always gives a valid state', () => {
    const random = seededRandom(1);
    for (let i = 0; i < 2000; i++) expect(isValid(randomState(random))).toBe(true);
  });

  it('works with the secure random source', () => {
    expect(isValid(randomState(cryptoRandom()))).toBe(true);
  });

  it('is reproducible with a seeded source', () => {
    expect(isEqual(randomState(seededRandom(9)), randomState(seededRandom(9)))).toBe(true);
    expect(isEqual(randomState(seededRandom(9)), randomState(seededRandom(10)))).toBe(false);
  });

  it('puts every corner in every position evenly', () => {
    const random = seededRandom(2);
    const counts = new Array(8).fill(0);
    for (let i = 0; i < SAMPLES; i++) counts[randomState(random).cp[0]] += 1;
    expect(chiSquare(counts)).toBeLessThan(24.32);
  });

  it('puts every edge in the last positions evenly despite the parity fix', () => {
    const random = seededRandom(3);
    const last = new Array(12).fill(0);
    const beforeLast = new Array(12).fill(0);
    for (let i = 0; i < SAMPLES; i++) {
      const { ep } = randomState(random);
      last[ep[11]] += 1;
      beforeLast[ep[10]] += 1;
    }
    expect(chiSquare(last)).toBeLessThan(31.26);
    expect(chiSquare(beforeLast)).toBeLessThan(31.26);
  });

  it('draws both permutation parities evenly', () => {
    const random = seededRandom(4);
    const counts = [0, 0];
    for (let i = 0; i < SAMPLES; i++) counts[permutationParity(randomState(random).cp)] += 1;
    expect(chiSquare(counts)).toBeLessThan(10.83);
  });

  it('orients the last corner and the last edge evenly', () => {
    const random = seededRandom(5);
    const corner = [0, 0, 0];
    const edge = [0, 0];
    for (let i = 0; i < SAMPLES; i++) {
      const state = randomState(random);
      corner[state.co[7]] += 1;
      edge[state.eo[11]] += 1;
    }
    expect(chiSquare(corner)).toBeLessThan(13.82);
    expect(chiSquare(edge)).toBeLessThan(10.83);
  });
});

const CROSS: StateConstraint = {
  edges: [
    { piece: 4, position: 0, orientation: 1 },
    { piece: 5, position: 9, orientation: 0 },
    { piece: 6, position: 3, orientation: 0 },
    { piece: 7, position: 7, orientation: 1 },
  ],
};

describe('constrainedState', () => {
  it('places the given pieces and keeps the state valid', () => {
    const random = seededRandom(3);
    for (let i = 0; i < 2000; i++) {
      const state = constrainedState(random, CROSS);
      expect(isValid(state)).toBe(true);
      for (const { piece, position, orientation } of CROSS.edges ?? []) {
        expect(state.ep[position]).toBe(piece);
        expect(state.eo[position]).toBe(orientation);
      }
    }
  });

  it('spreads the free pieces evenly', () => {
    const random = seededRandom(4);
    const corners = new Array(8).fill(0);
    const edges = new Array(8).fill(0);
    const free = [0, 1, 2, 3, 8, 9, 10, 11];
    for (let i = 0; i < SAMPLES; i++) {
      const state = constrainedState(random, CROSS);
      corners[state.cp[0]] += 1;
      edges[free.indexOf(state.ep[1])] += 1;
    }
    expect(chiSquare(corners)).toBeLessThan(24.32);
    expect(chiSquare(edges)).toBeLessThan(24.32);
  });

  it('fixes corners too, and fixes the parity with the corners when no two edges are free', () => {
    const random = seededRandom(5);
    const edges = Array.from({ length: 12 }, (_, i) => ({ piece: i, position: i, orientation: 0 }));
    const corners = [{ piece: 1, position: 0, orientation: 2 }];
    for (let i = 0; i < 200; i++) {
      const state = constrainedState(random, { edges, corners });
      expect(isValid(state)).toBe(true);
      expect(state.cp[0]).toBe(1);
      expect(permutationParity(state.cp)).toBe(0);
    }
  });

  it('gives a plain random state without constraint', () => {
    expect(isValid(constrainedState(seededRandom(6), {}))).toBe(true);
  });

  it('refuses impossible or malformed constraints', () => {
    const random = seededRandom(7);
    const all = (flip: number) =>
      Array.from({ length: 12 }, (_, i) => ({
        piece: i,
        position: i,
        orientation: i === 0 ? flip : 0,
      }));
    expect(() => constrainedState(random, { edges: all(1) })).toThrow('impossible orientation');
    const swapped = all(0).map((p, i) => (i < 2 ? { ...p, piece: 1 - i } : p));
    const corners = Array.from({ length: 8 }, (_, i) => ({
      piece: i,
      position: i,
      orientation: 0,
    }));
    expect(() => constrainedState(random, { edges: swapped, corners })).toThrow(
      'impossible permutation',
    );
    expect(() =>
      constrainedState(random, { edges: [{ piece: 12, position: 0, orientation: 0 }] }),
    ).toThrow(RangeError);
    expect(() =>
      constrainedState(random, { edges: [{ piece: 0, position: 0, orientation: 2 }] }),
    ).toThrow(RangeError);
    expect(() =>
      constrainedState(random, {
        edges: [
          { piece: 0, position: 0, orientation: 0 },
          { piece: 0, position: 1, orientation: 0 },
        ],
      }),
    ).toThrow('placed twice');
  });
});
