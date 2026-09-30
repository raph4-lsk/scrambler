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
} from './coordinates';
import { FACES, moveState, type Amount, type Move } from './moves';
import type { CubeState } from './state';

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

let cached: MoveTables | undefined;

/**
 * Returns the move tables of every coordinate, building them on first use.
 * @returns For each coordinate value and move, the coordinate value after the move.
 */
export function getMoveTables(): MoveTables {
  cached ??= buildMoveTables();
  return cached;
}

/**
 * Builds the move tables: phase 1 coordinates use all 18 moves, phase 2 ones the 10 phase 2 moves.
 * @returns The move tables.
 */
function buildMoveTables(): MoveTables {
  const all = MOVES.map(moveState);
  const phase2 = PHASE2_MOVES.map((index) => all[index]);
  return {
    twist: buildTable(Uint16Array, TWIST_COUNT, all, setTwist, (co, m) =>
      getTwist(m.cp.map((from, i) => (co[from] + m.co[i]) % 3)),
    ),
    flip: buildTable(Uint16Array, FLIP_COUNT, all, setFlip, (eo, m) =>
      getFlip(m.ep.map((from, i) => (eo[from] + m.eo[i]) % 2)),
    ),
    slice: buildTable(Uint16Array, SLICE_COUNT, all, setSlice, (ep, m) =>
      getSlice(m.ep.map((from) => ep[from])),
    ),
    cornerPerm: buildTable(Uint16Array, CORNER_PERM_COUNT, phase2, setCornerPerm, (cp, m) =>
      getCornerPerm(m.cp.map((from) => cp[from])),
    ),
    udEdgePerm: buildTable(
      Uint16Array,
      UD_EDGE_PERM_COUNT,
      phase2,
      (e) => setPhase2EdgePerm(e, 0),
      (ep, m) => getUDEdgePerm(m.ep.map((from) => ep[from])),
    ),
    slicePerm: buildTable(
      Uint8Array,
      SLICE_PERM_COUNT,
      phase2,
      (sp) => setPhase2EdgePerm(0, sp),
      (ep, m) => getSlicePerm(m.ep.map((from) => ep[from])),
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
 * @returns The table, indexed by value times the number of moves plus the move index.
 */
function buildTable<T extends Uint8Array | Uint16Array>(
  ArrayType: new (length: number) => T,
  count: number,
  moves: readonly CubeState[],
  decode: (value: number) => number[],
  apply: (pieces: number[], move: CubeState) => number,
): T {
  const table = new ArrayType(count * moves.length);
  for (let value = 0; value < count; value++) {
    const pieces = decode(value);
    moves.forEach((move, m) => {
      table[value * moves.length + m] = apply(pieces, move);
    });
  }
  return table;
}
