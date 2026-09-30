import {
  CORNER_PERM_COUNT,
  FLIP_COUNT,
  getCornerPerm,
  getFlip,
  getSlice,
  getSlicePerm,
  getTwist,
  getUDEdgePerm,
  TWIST_COUNT,
  UD_EDGE_PERM_COUNT,
} from './coordinates';
import { getMoveTables, MOVE_COUNT, MOVES, PHASE2_MOVE_COUNT, PHASE2_MOVES } from './move-tables';
import { applyMoves, type Move } from './moves';
import { GOAL_SLICE, getPruningTables } from './pruning-tables';
import type { CubeState } from './state';

export const DEFAULT_MAX_LENGTH = 22;

const FACE_COUNT = 6;
const IS_PHASE2_MOVE = MOVES.map((_, index) => PHASE2_MOVES.includes(index));

/**
 * Finds a sequence of face turns that solves a state, with Kociemba's two-phase algorithm.
 * @param state - A valid cube state.
 * @param maxLength - The longest solution accepted, in moves.
 * @returns The solving moves, or null if no solution fits within maxLength.
 */
export function solve(state: CubeState, maxLength: number = DEFAULT_MAX_LENGTH): Move[] | null {
  const moveTables = getMoveTables();
  const pruning = getPruningTables();
  const path: number[] = [];

  /**
   * Searches phase 1 moves that bring the cube into the phase 2 group in exactly depth moves.
   * @param twist - The current twist coordinate.
   * @param flip - The current flip coordinate.
   * @param slice - The current slice coordinate.
   * @param depth - The number of phase 1 moves left.
   * @param lastFace - The face of the previous move, or -1.
   * @returns True once a full solution is in path.
   */
  function phase1(
    twist: number,
    flip: number,
    slice: number,
    depth: number,
    lastFace: number,
  ): boolean {
    if (depth === 0) {
      if (twist !== 0 || flip !== 0 || slice !== GOAL_SLICE) return false;
      if (path.length > 0 && IS_PHASE2_MOVE[path[path.length - 1]]) return false;
      return startPhase2(lastFace);
    }
    const bound = Math.max(
      pruning.sliceTwist[slice * TWIST_COUNT + twist],
      pruning.sliceFlip[slice * FLIP_COUNT + flip],
    );
    if (bound > depth) return false;
    for (let m = 0; m < MOVE_COUNT; m++) {
      const face = Math.floor(m / 3);
      if (isRedundant(face, lastFace)) continue;
      path.push(m);
      if (
        phase1(
          moveTables.twist[twist * MOVE_COUNT + m],
          moveTables.flip[flip * MOVE_COUNT + m],
          moveTables.slice[slice * MOVE_COUNT + m],
          depth - 1,
          face,
        )
      ) {
        return true;
      }
      path.pop();
    }
    return false;
  }

  /**
   * Starts phase 2 from the state reached by the current phase 1 moves.
   * @param lastFace - The face of the last phase 1 move, or -1.
   * @returns True once a full solution is in path.
   */
  function startPhase2(lastFace: number): boolean {
    const reached = applyMoves(
      state,
      path.map((m) => MOVES[m]),
    );
    const cornerPerm = getCornerPerm(reached.cp);
    const udEdgePerm = getUDEdgePerm(reached.ep);
    const slicePerm = getSlicePerm(reached.ep);
    for (let depth = 0; depth <= maxLength - path.length; depth++) {
      if (phase2(cornerPerm, udEdgePerm, slicePerm, depth, lastFace)) return true;
    }
    return false;
  }

  /**
   * Searches phase 2 moves that solve the cube in exactly depth moves.
   * @param cornerPerm - The current corner permutation coordinate.
   * @param udEdgePerm - The current U and D edge permutation coordinate.
   * @param slicePerm - The current slice permutation coordinate.
   * @param depth - The number of phase 2 moves left.
   * @param lastFace - The face of the previous move, or -1.
   * @returns True once the cube is solved.
   */
  function phase2(
    cornerPerm: number,
    udEdgePerm: number,
    slicePerm: number,
    depth: number,
    lastFace: number,
  ): boolean {
    if (depth === 0) return cornerPerm === 0 && udEdgePerm === 0 && slicePerm === 0;
    const bound = Math.max(
      pruning.sliceCornerPerm[slicePerm * CORNER_PERM_COUNT + cornerPerm],
      pruning.sliceUDEdgePerm[slicePerm * UD_EDGE_PERM_COUNT + udEdgePerm],
    );
    if (bound > depth) return false;
    for (let k = 0; k < PHASE2_MOVE_COUNT; k++) {
      const m = PHASE2_MOVES[k];
      const face = Math.floor(m / 3);
      if (isRedundant(face, lastFace)) continue;
      path.push(m);
      if (
        phase2(
          moveTables.cornerPerm[cornerPerm * PHASE2_MOVE_COUNT + k],
          moveTables.udEdgePerm[udEdgePerm * PHASE2_MOVE_COUNT + k],
          moveTables.slicePerm[slicePerm * PHASE2_MOVE_COUNT + k],
          depth - 1,
          face,
        )
      ) {
        return true;
      }
      path.pop();
    }
    return false;
  }

  const twist = getTwist(state.co);
  const flip = getFlip(state.eo);
  const slice = getSlice(state.ep);
  for (let depth = 0; depth <= maxLength; depth++) {
    if (phase1(twist, flip, slice, depth, -1)) return path.map((m) => MOVES[m]);
  }
  return null;
}

/**
 * Tells whether a move on a face can be skipped after a move on the last face.
 * @param face - The face index of the candidate move.
 * @param lastFace - The face index of the previous move, or -1.
 * @returns True for the same face, or an opposite face already turned in the other order.
 */
function isRedundant(face: number, lastFace: number): boolean {
  return face === lastFace || (face === (lastFace + 3) % FACE_COUNT && face < lastFace);
}
