import {
  CORNER_PERM_COUNT,
  FLIP_COUNT,
  getSlice,
  SLICE_COUNT,
  SLICE_PERM_COUNT,
  TWIST_COUNT,
  UD_EDGE_PERM_COUNT,
} from './coordinates';
import { getMoveTables, MOVE_COUNT, PHASE2_MOVE_COUNT } from './move-tables';
import { SOLVED } from './state';

export const GOAL_SLICE = getSlice(SOLVED.ep);

export interface PruningTables {
  readonly sliceTwist: Uint8Array;
  readonly sliceFlip: Uint8Array;
  readonly sliceCornerPerm: Uint8Array;
  readonly sliceUDEdgePerm: Uint8Array;
}

const UNVISITED = 255;

let cached: PruningTables | undefined;

/**
 * Returns the pruning tables, building them on first use.
 * @returns For each pair of coordinates, the exact number of moves needed to reach the phase goal.
 */
export function getPruningTables(): PruningTables {
  cached ??= buildPruningTables();
  return cached;
}

/**
 * Builds the two phase 1 tables and the two phase 2 tables.
 * @returns The pruning tables.
 */
function buildPruningTables(): PruningTables {
  const moves = getMoveTables();
  return {
    sliceTwist: breadthFirst(
      { count: SLICE_COUNT, table: moves.slice, goal: GOAL_SLICE },
      { count: TWIST_COUNT, table: moves.twist, goal: 0 },
      MOVE_COUNT,
    ),
    sliceFlip: breadthFirst(
      { count: SLICE_COUNT, table: moves.slice, goal: GOAL_SLICE },
      { count: FLIP_COUNT, table: moves.flip, goal: 0 },
      MOVE_COUNT,
    ),
    sliceCornerPerm: breadthFirst(
      { count: SLICE_PERM_COUNT, table: moves.slicePerm, goal: 0 },
      { count: CORNER_PERM_COUNT, table: moves.cornerPerm, goal: 0 },
      PHASE2_MOVE_COUNT,
    ),
    sliceUDEdgePerm: breadthFirst(
      { count: SLICE_PERM_COUNT, table: moves.slicePerm, goal: 0 },
      { count: UD_EDGE_PERM_COUNT, table: moves.udEdgePerm, goal: 0 },
      PHASE2_MOVE_COUNT,
    ),
  };
}

interface Coordinate {
  readonly count: number;
  readonly table: Uint8Array | Uint16Array;
  readonly goal: number;
}

/**
 * Computes the distance to the goal of every pair of coordinate values, one depth at a time.
 * Expands the frontier forward while it is small, then lets each unvisited entry look for a parent.
 * @param outer - The coordinate that varies slowest in the table index.
 * @param inner - The coordinate that varies fastest in the table index.
 * @param moveCount - The number of moves in both move tables, which contain every inverse move.
 * @returns The distances, indexed by outer value times inner count plus inner value.
 */
function breadthFirst(outer: Coordinate, inner: Coordinate, moveCount: number): Uint8Array {
  const size = outer.count * inner.count;
  const distances = new Uint8Array(size).fill(UNVISITED);
  distances[outer.goal * inner.count + inner.goal] = 0;
  let visited = 1;
  for (let depth = 0; visited < size; depth++) {
    const backward = visited * 2 > size;
    const wanted = backward ? UNVISITED : depth;
    for (let a = 0; a < outer.count; a++) {
      const outerRow = a * moveCount;
      const base = a * inner.count;
      for (let b = 0; b < inner.count; b++) {
        if (distances[base + b] !== wanted) continue;
        const innerRow = b * moveCount;
        for (let m = 0; m < moveCount; m++) {
          const neighbour = outer.table[outerRow + m] * inner.count + inner.table[innerRow + m];
          if (backward) {
            if (distances[neighbour] === depth) {
              distances[base + b] = depth + 1;
              visited++;
              break;
            }
          } else if (distances[neighbour] === UNVISITED) {
            distances[neighbour] = depth + 1;
            visited++;
          }
        }
      }
    }
  }
  return distances;
}
