export const CORNER_COUNT = 8;
export const EDGE_COUNT = 12;

export interface CubeState {
  readonly cp: readonly number[];
  readonly co: readonly number[];
  readonly ep: readonly number[];
  readonly eo: readonly number[];
}

export const SOLVED: CubeState = {
  cp: [0, 1, 2, 3, 4, 5, 6, 7],
  co: [0, 0, 0, 0, 0, 0, 0, 0],
  ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

/**
 * Composes two states: the result is a with b applied after it.
 * @param a - The first state.
 * @param b - The state applied after a, usually a move.
 * @returns The combined state.
 */
export function multiply(a: CubeState, b: CubeState): CubeState {
  return {
    cp: b.cp.map((from) => a.cp[from]),
    co: b.cp.map((from, i) => (a.co[from] + b.co[i]) % 3),
    ep: b.ep.map((from) => a.ep[from]),
    eo: b.ep.map((from, i) => (a.eo[from] + b.eo[i]) % 2),
  };
}

/**
 * Returns the state that undoes the given one.
 * @param state - The state to invert.
 * @returns The inverse state, so that multiply(state, inverse(state)) is solved.
 */
export function inverse(state: CubeState): CubeState {
  const cp = new Array<number>(CORNER_COUNT);
  const co = new Array<number>(CORNER_COUNT);
  const ep = new Array<number>(EDGE_COUNT);
  const eo = new Array<number>(EDGE_COUNT);
  state.cp.forEach((piece, i) => {
    cp[piece] = i;
    co[piece] = (3 - state.co[i]) % 3;
  });
  state.ep.forEach((piece, i) => {
    ep[piece] = i;
    eo[piece] = state.eo[i];
  });
  return { cp, co, ep, eo };
}

/**
 * Tells whether two states are identical.
 * @param a - The first state.
 * @param b - The second state.
 * @returns True if every piece has the same position and orientation.
 */
export function isEqual(a: CubeState, b: CubeState): boolean {
  return (
    sameValues(a.cp, b.cp) &&
    sameValues(a.co, b.co) &&
    sameValues(a.ep, b.ep) &&
    sameValues(a.eo, b.eo)
  );
}

/**
 * Tells whether a state is solved.
 * @param state - The state to check.
 * @returns True if every piece is in place and oriented.
 */
export function isSolved(state: CubeState): boolean {
  return isEqual(state, SOLVED);
}

/**
 * Tells whether a state can be reached from the solved cube by face turns.
 * @param state - The state to check.
 * @returns True if both permutations are valid, orientations sum to zero and parities match.
 */
export function isValid(state: CubeState): boolean {
  return (
    isPermutation(state.cp, CORNER_COUNT) &&
    isPermutation(state.ep, EDGE_COUNT) &&
    hasOrientations(state.co, CORNER_COUNT, 3) &&
    hasOrientations(state.eo, EDGE_COUNT, 2) &&
    sum(state.co) % 3 === 0 &&
    sum(state.eo) % 2 === 0 &&
    permutationParity(state.cp) === permutationParity(state.ep)
  );
}

/**
 * Returns the parity of a permutation.
 * @param permutation - A permutation of 0 to n - 1.
 * @returns 0 for an even permutation, 1 for an odd one.
 */
export function permutationParity(permutation: readonly number[]): number {
  let parity = 0;
  for (let i = 0; i < permutation.length; i++) {
    for (let j = i + 1; j < permutation.length; j++) {
      if (permutation[i] > permutation[j]) parity ^= 1;
    }
  }
  return parity;
}

/**
 * Tells whether an array holds each integer from 0 to size - 1 exactly once.
 * @param values - The array to check.
 * @param size - The expected length.
 * @returns True if values is a permutation of the given size.
 */
function isPermutation(values: readonly number[], size: number): boolean {
  return (
    values.length === size &&
    new Set(values).size === size &&
    values.every((v) => v >= 0 && v < size)
  );
}

/**
 * Tells whether an array holds valid orientation values.
 * @param values - The orientations to check.
 * @param size - The expected length.
 * @param modulo - The number of orientations of each piece.
 * @returns True if every value is an integer in [0, modulo).
 */
function hasOrientations(values: readonly number[], size: number, modulo: number): boolean {
  return values.length === size && values.every((v) => Number.isInteger(v) && v >= 0 && v < modulo);
}

/**
 * Adds up an array of numbers.
 * @param values - The numbers to add.
 * @returns Their sum.
 */
function sum(values: readonly number[]): number {
  return values.reduce((total, v) => total + v, 0);
}

/**
 * Compares two arrays element by element.
 * @param a - The first array.
 * @param b - The second array.
 * @returns True if both have the same length and values.
 */
function sameValues(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
