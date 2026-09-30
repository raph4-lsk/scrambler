import { describe, expect, it } from 'vitest';
import {
  CORNER_PERM_COUNT,
  FLIP_COUNT,
  getCornerPerm,
  getFlip,
  getSlice,
  getSlicePerm,
  getTwist,
  getUDEdgePerm,
  setCornerPerm,
  setFlip,
  setPhase2EdgePerm,
  setSlice,
  setTwist,
  SLICE_COUNT,
  SLICE_PERM_COUNT,
  TWIST_COUNT,
  UD_EDGE_PERM_COUNT,
} from '@/puzzles/cube333/coordinates';
import { SOLVED } from '@/puzzles/cube333/state';

/**
 * Checks that decoding then encoding every value of a coordinate gives it back.
 * @param count - The number of values of the coordinate.
 * @param roundTrip - Decodes then encodes a value.
 * @returns Nothing.
 */
function expectBijection(count: number, roundTrip: (value: number) => number): void {
  for (let value = 0; value < count; value++) expect(roundTrip(value)).toBe(value);
}

describe('phase 1 coordinates', () => {
  it('encodes every twist, flip and slice value exactly once', () => {
    expectBijection(TWIST_COUNT, (v) => getTwist(setTwist(v)));
    expectBijection(FLIP_COUNT, (v) => getFlip(setFlip(v)));
    expectBijection(SLICE_COUNT, (v) => getSlice(setSlice(v)));
  });

  it('keeps orientation sums valid', () => {
    for (let v = 0; v < TWIST_COUNT; v += 37) {
      expect(setTwist(v).reduce((a, b) => a + b, 0) % 3).toBe(0);
    }
    for (let v = 0; v < FLIP_COUNT; v += 37) {
      expect(setFlip(v).reduce((a, b) => a + b, 0) % 2).toBe(0);
    }
  });

  it('gives zero orientations for the solved cube', () => {
    expect(getTwist(SOLVED.co)).toBe(0);
    expect(getFlip(SOLVED.eo)).toBe(0);
  });

  it('places the four slice edges at the slice positions', () => {
    for (let v = 0; v < SLICE_COUNT; v += 13) {
      expect(setSlice(v).filter((edge) => edge >= 8)).toHaveLength(4);
    }
  });
});

describe('phase 2 coordinates', () => {
  it('encodes every permutation exactly once', () => {
    expectBijection(CORNER_PERM_COUNT, (v) => getCornerPerm(setCornerPerm(v)));
    expectBijection(UD_EDGE_PERM_COUNT, (v) => getUDEdgePerm(setPhase2EdgePerm(v, 0)));
    expectBijection(SLICE_PERM_COUNT, (v) => getSlicePerm(setPhase2EdgePerm(0, v)));
  });

  it('gives zero for the solved cube', () => {
    expect(getCornerPerm(SOLVED.cp)).toBe(0);
    expect(getUDEdgePerm(SOLVED.ep)).toBe(0);
    expect(getSlicePerm(SOLVED.ep)).toBe(0);
  });
});
