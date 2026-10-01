import {
  CORNER_PERM_COUNT,
  FLIP_COUNT,
  getFlip,
  getSlice,
  getTwist,
  setFlip,
  setSlice,
  setTwist,
  SLICE_COUNT,
  SLICE_PERM_COUNT,
  TWIST_COUNT,
  UD_EDGE_PERM_COUNT,
} from './coordinates';
import { FACES, moveState, type Amount, type Move } from './moves';
import type { CubeState } from './state';
import { runSync, type Steps } from '../../steps';

export const MOVES: readonly Move[] = FACES.flatMap((face) =>
  ([1, 2, 3] as const).map((amount: Amount) => ({ face, amount })),
);
export const MOVE_COUNT = MOVES.length;

export const PHASE2_MOVES: readonly number[] = MOVES.flatMap((move, index) =>
  move.face === 'U' || move.face === 'D' || move.amount === 2 ? [index] : [],
);
export const PHASE2_MOVE_COUNT = PHASE2_MOVES.length;

export interface MoveTables {
  readonly twist: Uint16Array;
  readonly flip: Uint16Array;
  readonly slice: Uint16Array;
  readonly cornerPerm: Uint16Array;
  readonly udEdgePerm: Uint16Array;
  readonly slicePerm: Uint8Array;
}

const BIT_COUNTS = Uint8Array.from({ length: 256 }, (_, n) => {
  let count = 0;
  for (let bits = n; bits > 0; bits >>= 1) count += bits & 1;
  return count;
});

const RANKS_PER_STEP = 2048;
const VALUES_PER_STEP = 256;

let cached: MoveTables | undefined;

/**
 * Returns the move tables of every coordinate, building them on first use.
 * @returns For each coordinate value and move, the coordinate value after the move.
 */
export function getMoveTables(): MoveTables {
  return runSync(moveTablesSteps());
}

/**
 * Builds the move tables step by step, or returns them at once if already built.
 * @returns A generator that pauses regularly and returns the move tables.
 */
export function* moveTablesSteps(): Steps<MoveTables> {
  cached ??= yield* buildMoveTables();
  return cached;
}

/**
 * Builds the move tables: phase 1 coordinates use all 18 moves, phase 2 ones the 10 phase 2 moves.
 * @returns A generator that pauses regularly and returns the move tables.
 */
function* buildMoveTables(): Steps<MoveTables> {
  const all = MOVES.map(moveState);
  const phase2 = PHASE2_MOVES.map((index) => all[index]);
  return {
    twist: yield* buildTable(Uint16Array, TWIST_COUNT, all, setTwist, (co, m) =>
      getTwist(m.cp.map((from, i) => (co[from] + m.co[i]) % 3)),
    ),
    flip: yield* buildTable(Uint16Array, FLIP_COUNT, all, setFlip, (eo, m) =>
      getFlip(m.ep.map((from, i) => (eo[from] + m.eo[i]) % 2)),
    ),
    slice: yield* buildTable(Uint16Array, SLICE_COUNT, all, setSlice, (ep, m) =>
      getSlice(m.ep.map((from) => ep[from])),
    ),
    cornerPerm: yield* buildPermutationTable(
      new Uint16Array(CORNER_PERM_COUNT * phase2.length),
      phase2.map((m) => m.cp),
    ),
    udEdgePerm: yield* buildPermutationTable(
      new Uint16Array(UD_EDGE_PERM_COUNT * phase2.length),
      phase2.map((m) => m.ep.slice(0, 8)),
    ),
    slicePerm: yield* buildPermutationTable(
      new Uint8Array(SLICE_PERM_COUNT * phase2.length),
      phase2.map((m) => m.ep.slice(8).map((from) => from - 8)),
    ),
  };
}

/**
 * Fills a move table by applying every move to every coordinate value.
 * @param ArrayType - The typed array class to allocate.
 * @param count - The number of coordinate values.
 * @param moves - The move states, in table order.
 * @param decode - Turns a coordinate value into the pieces it describes, once per value.
 * @param apply - Returns the coordinate value after applying a move to the decoded pieces.
 * @returns A generator that pauses every few hundred values and returns the table.
 */
function* buildTable<T extends Uint8Array | Uint16Array>(
  ArrayType: new (length: number) => T,
  count: number,
  moves: readonly CubeState[],
  decode: (value: number) => number[],
  apply: (pieces: number[], move: CubeState) => number,
): Steps<T> {
  const table = new ArrayType(count * moves.length);
  for (let value = 0; value < count; value++) {
    if (value % VALUES_PER_STEP === 0) yield;
    const pieces = decode(value);
    moves.forEach((move, m) => {
      table[value * moves.length + m] = apply(pieces, move);
    });
  }
  return table;
}

/**
 * Fills the move table of a permutation coordinate without allocating per entry.
 * @param table - The table to fill, sized as n! times the number of moves.
 * @param moves - For each move and position, the position the piece comes from.
 * @returns A generator that pauses every few thousand ranks and returns the filled table.
 */
function* buildPermutationTable<T extends Uint8Array | Uint16Array>(
  table: T,
  moves: readonly (readonly number[])[],
): Steps<T> {
  const size = moves[0].length;
  const count = table.length / moves.length;
  const permutation = Int8Array.from({ length: size }, (_, i) => i);
  for (let rank = 0; rank < count; rank++) {
    if (rank > 0) nextPermutation(permutation);
    if (rank % RANKS_PER_STEP === 0) yield;
    for (let m = 0; m < moves.length; m++) {
      const from = moves[m];
      let next = 0;
      let seen = 0;
      for (let i = 0; i < size; i++) {
        const value = permutation[from[i]];
        next = next * (size - i) + value - BIT_COUNTS[seen & ((1 << value) - 1)];
        seen |= 1 << value;
      }
      table[rank * moves.length + m] = next;
    }
  }
  return table;
}

/**
 * Rearranges a permutation into the next one in lexicographic order.
 * @param permutation - The permutation to advance in place; it must not be the last one.
 * @returns Nothing.
 */
function nextPermutation(permutation: Int8Array): void {
  let i = permutation.length - 2;
  while (permutation[i] > permutation[i + 1]) i--;
  let j = permutation.length - 1;
  while (permutation[j] < permutation[i]) j--;
  [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  permutation.subarray(i + 1).reverse();
}
