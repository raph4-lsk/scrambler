import { CORNER_COUNT, EDGE_COUNT } from './state';

export const TWIST_COUNT = 2187;
export const FLIP_COUNT = 2048;
export const SLICE_COUNT = 495;
export const CORNER_PERM_COUNT = 40320;
export const UD_EDGE_PERM_COUNT = 40320;
export const SLICE_PERM_COUNT = 24;

const FIRST_SLICE_EDGE = 8;
const SLICE_EDGE_COUNT = 4;
const UD_EDGE_COUNT = 8;

/**
 * Encodes the corner orientations as a base 3 number, the last corner being implied.
 * @param co - The corner orientations.
 * @returns The twist coordinate, from 0 to 2186.
 */
export function getTwist(co: readonly number[]): number {
  let twist = 0;
  for (let i = 0; i < CORNER_COUNT - 1; i++) twist = twist * 3 + co[i];
  return twist;
}

/**
 * Decodes a twist coordinate into valid corner orientations.
 * @param twist - The twist coordinate.
 * @returns The corner orientations, summing to a multiple of 3.
 */
export function setTwist(twist: number): number[] {
  const co = new Array<number>(CORNER_COUNT);
  let total = 0;
  for (let i = CORNER_COUNT - 2; i >= 0; i--) {
    co[i] = twist % 3;
    total += co[i];
    twist = Math.floor(twist / 3);
  }
  co[CORNER_COUNT - 1] = (3 - (total % 3)) % 3;
  return co;
}

/**
 * Encodes the edge orientations as a base 2 number, the last edge being implied.
 * @param eo - The edge orientations.
 * @returns The flip coordinate, from 0 to 2047.
 */
export function getFlip(eo: readonly number[]): number {
  let flip = 0;
  for (let i = 0; i < EDGE_COUNT - 1; i++) flip = flip * 2 + eo[i];
  return flip;
}

/**
 * Decodes a flip coordinate into valid edge orientations.
 * @param flip - The flip coordinate.
 * @returns The edge orientations, summing to a multiple of 2.
 */
export function setFlip(flip: number): number[] {
  const eo = new Array<number>(EDGE_COUNT);
  let total = 0;
  for (let i = EDGE_COUNT - 2; i >= 0; i--) {
    eo[i] = flip % 2;
    total += eo[i];
    flip = Math.floor(flip / 2);
  }
  eo[EDGE_COUNT - 1] = total % 2;
  return eo;
}

/**
 * Encodes which positions hold the four middle slice edges, ignoring their order.
 * @param ep - The edge permutation.
 * @returns The slice coordinate, from 0 to 494.
 */
export function getSlice(ep: readonly number[]): number {
  return rankCombination(ep.map((edge) => edge >= FIRST_SLICE_EDGE));
}

/**
 * Builds an edge permutation whose middle slice edges sit at the positions of a slice coordinate.
 * @param slice - The slice coordinate.
 * @returns An edge permutation with that slice coordinate.
 */
export function setSlice(slice: number): number[] {
  const occupied = unrankCombination(slice, EDGE_COUNT, SLICE_EDGE_COUNT);
  let sliceEdge = FIRST_SLICE_EDGE;
  let otherEdge = 0;
  return occupied.map((isSlice) => (isSlice ? sliceEdge++ : otherEdge++));
}

/**
 * Encodes the permutation of the eight corners.
 * @param cp - The corner permutation.
 * @returns The corner permutation coordinate, from 0 to 40319.
 */
export function getCornerPerm(cp: readonly number[]): number {
  return rankPermutation(cp);
}

/**
 * Decodes a corner permutation coordinate.
 * @param index - The corner permutation coordinate.
 * @returns The corner permutation.
 */
export function setCornerPerm(index: number): number[] {
  return unrankPermutation(index, CORNER_COUNT);
}

/**
 * Encodes the permutation of the eight U and D edges, valid once the cube is in the phase 2 group.
 * @param ep - The edge permutation, with the U and D edges in the first eight positions.
 * @returns The U and D edge permutation coordinate, from 0 to 40319.
 */
export function getUDEdgePerm(ep: readonly number[]): number {
  return rankPermutation(ep.slice(0, UD_EDGE_COUNT));
}

/**
 * Encodes the permutation of the four middle slice edges, valid once the cube is in the phase 2 group.
 * @param ep - The edge permutation, with the slice edges in the last four positions.
 * @returns The slice permutation coordinate, from 0 to 23.
 */
export function getSlicePerm(ep: readonly number[]): number {
  return rankPermutation(ep.slice(UD_EDGE_COUNT).map((edge) => edge - FIRST_SLICE_EDGE));
}

/**
 * Builds a phase 2 edge permutation from its two coordinates.
 * @param udEdgePerm - The U and D edge permutation coordinate.
 * @param slicePerm - The slice permutation coordinate.
 * @returns The full edge permutation.
 */
export function setPhase2EdgePerm(udEdgePerm: number, slicePerm: number): number[] {
  const udEdges = unrankPermutation(udEdgePerm, UD_EDGE_COUNT);
  const sliceEdges = unrankPermutation(slicePerm, SLICE_EDGE_COUNT).map(
    (edge) => edge + FIRST_SLICE_EDGE,
  );
  return [...udEdges, ...sliceEdges];
}

/**
 * Returns the binomial coefficient n choose k.
 * @param n - The size of the set.
 * @param k - The size of the subset.
 * @returns The number of k element subsets, which is 0 when k is greater than n.
 */
function choose(n: number, k: number): number {
  let result = 1;
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1);
  return result;
}

/**
 * Ranks a subset, given as flags, in lexicographic order where taking a position comes first.
 * @param flags - True for each position in the subset.
 * @returns The rank of the subset among subsets of the same size.
 */
function rankCombination(flags: readonly boolean[]): number {
  let remaining = flags.filter(Boolean).length;
  let rank = 0;
  for (let p = 0; p < flags.length && remaining > 0; p++) {
    if (flags[p]) remaining--;
    else rank += choose(flags.length - 1 - p, remaining - 1);
  }
  return rank;
}

/**
 * Rebuilds the subset of a given rank.
 * @param rank - The rank from rankCombination.
 * @param n - The number of positions.
 * @param k - The subset size.
 * @returns True for each position in the subset.
 */
function unrankCombination(rank: number, n: number, k: number): boolean[] {
  const flags = new Array<boolean>(n).fill(false);
  let remaining = k;
  for (let p = 0; p < n && remaining > 0; p++) {
    const taking = choose(n - 1 - p, remaining - 1);
    if (rank < taking) {
      flags[p] = true;
      remaining--;
    } else {
      rank -= taking;
    }
  }
  return flags;
}

/**
 * Ranks a permutation in lexicographic order.
 * @param permutation - A permutation of 0 to n - 1.
 * @returns Its rank, from 0 to n! - 1.
 */
function rankPermutation(permutation: readonly number[]): number {
  let rank = 0;
  for (let i = 0; i < permutation.length; i++) {
    let smaller = 0;
    for (let j = i + 1; j < permutation.length; j++) {
      if (permutation[j] < permutation[i]) smaller++;
    }
    rank = rank * (permutation.length - i) + smaller;
  }
  return rank;
}

/**
 * Rebuilds the permutation of a given rank.
 * @param rank - The rank from rankPermutation.
 * @param n - The permutation size.
 * @returns The permutation of 0 to n - 1.
 */
function unrankPermutation(rank: number, n: number): number[] {
  const digits = new Array<number>(n);
  for (let i = n - 1; i >= 0; i--) {
    digits[i] = rank % (n - i);
    rank = Math.floor(rank / (n - i));
  }
  const available = Array.from({ length: n }, (_, i) => i);
  return digits.map((digit) => available.splice(digit, 1)[0]);
}
