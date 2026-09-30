import { multiply, SOLVED, type CubeState } from './state';

export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';
export type Amount = 1 | 2 | 3;

export interface Move {
  readonly face: Face;
  readonly amount: Amount;
}

export const FACES: readonly Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

const QUARTER_TURNS: Record<Face, CubeState> = {
  U: {
    cp: [3, 0, 1, 2, 4, 5, 6, 7],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  R: {
    cp: [4, 1, 2, 0, 7, 5, 6, 3],
    co: [2, 0, 0, 1, 1, 0, 0, 2],
    ep: [8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  F: {
    cp: [1, 5, 2, 3, 0, 4, 6, 7],
    co: [1, 2, 0, 0, 2, 1, 0, 0],
    ep: [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11],
    eo: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0],
  },
  D: {
    cp: [0, 1, 2, 3, 5, 6, 7, 4],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  L: {
    cp: [0, 2, 6, 3, 4, 1, 5, 7],
    co: [0, 1, 2, 0, 0, 2, 1, 0],
    ep: [0, 1, 10, 3, 4, 5, 9, 7, 8, 2, 6, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  B: {
    cp: [0, 1, 3, 7, 4, 5, 2, 6],
    co: [0, 0, 1, 2, 0, 0, 2, 1],
    ep: [0, 1, 2, 11, 4, 5, 6, 10, 8, 9, 3, 7],
    eo: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
  },
};

const MOVE_STATES = new Map<string, CubeState>(
  FACES.flatMap((face) => {
    const quarter = QUARTER_TURNS[face];
    const half = multiply(quarter, quarter);
    const prime = multiply(half, quarter);
    return [
      [`${face}1`, quarter],
      [`${face}2`, half],
      [`${face}3`, prime],
    ];
  }),
);

/**
 * Returns the state reached by applying a single move to the solved cube.
 * @param move - The face and number of clockwise quarter turns.
 * @returns The permutation and orientation change of the move.
 */
export function moveState(move: Move): CubeState {
  const state = MOVE_STATES.get(`${move.face}${move.amount}`);
  if (!state) throw new RangeError(`Unknown move ${move.face}${move.amount}`);
  return state;
}

/**
 * Applies a sequence of moves to a state.
 * @param state - The starting state.
 * @param moves - The moves to apply, in order.
 * @returns The resulting state.
 */
export function applyMoves(state: CubeState, moves: readonly Move[]): CubeState {
  return moves.reduce((current, move) => multiply(current, moveState(move)), state);
}

/**
 * Returns the moves that undo a sequence.
 * @param moves - The sequence to invert.
 * @returns The moves in reverse order, each turned the other way.
 */
export function invertMoves(moves: readonly Move[]): Move[] {
  return [...moves]
    .reverse()
    .map((move) => ({ face: move.face, amount: (4 - move.amount) as Amount }));
}

/**
 * Applies a sequence of moves to the solved cube.
 * @param moves - The moves to apply.
 * @returns The state they produce.
 */
export function stateFromMoves(moves: readonly Move[]): CubeState {
  return applyMoves(SOLVED, moves);
}
