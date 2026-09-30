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
 * @param outer - The coordinate that varies slowest in the table index.
 * @param inner - The coordinate that varies fastest in the table index.
 * @param moveCount - The number of moves in both move tables.
 * @returns The distances, indexed by outer value times inner count plus inner value.
 */
function breadthFirst(outer: Coordinate, inner: Coordinate, moveCount: number): Uint8Array {
  const size = outer.count * inner.count;
  const distances = new Uint8Array(size).fill(UNVISITED);
  distances[outer.goal * inner.count + inner.goal] = 0;
  let visited = 1;
  for (let depth = 0; visited < size; depth++) {
    const before = visited;
    for (let index = 0; index < size; index++) {
      if (distances[index] !== depth) continue;
      const a = Math.floor(index / inner.count) * moveCount;
      const b = (index % inner.count) * moveCount;
      for (let m = 0; m < moveCount; m++) {
        const next = outer.table[a + m] * inner.count + inner.table[b + m];
        if (distances[next] === UNVISITED) {
          distances[next] = depth + 1;
          visited++;
        }
      }
    }
    if (visited === before) break;
  }
  return distances;
}
