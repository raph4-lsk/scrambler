import { describe, expect, it } from 'vitest';
import { randomState } from '@/puzzles/cube333/random-state';
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
