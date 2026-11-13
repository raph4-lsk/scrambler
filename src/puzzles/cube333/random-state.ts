import type { RandomSource } from '../../random';
import { CORNER_COUNT, EDGE_COUNT, permutationParity, type CubeState } from './state';

/**
 * Draws a uniformly random state among all states reachable by face turns.
 * @param random - The source of randomness, cryptoRandom for real scrambles.
 * @returns A valid random state.
 */
export function randomState(random: RandomSource): CubeState {
  const cp = shuffledRange(CORNER_COUNT, random);
  const ep = shuffledRange(EDGE_COUNT, random);
  if (permutationParity(cp) !== permutationParity(ep)) {
    [ep[EDGE_COUNT - 2], ep[EDGE_COUNT - 1]] = [ep[EDGE_COUNT - 1], ep[EDGE_COUNT - 2]];
  }
  return {
    cp,
    co: randomOrientations(CORNER_COUNT, 3, random),
    ep,
    eo: randomOrientations(EDGE_COUNT, 2, random),
  };
}

/**
 * Returns a uniformly shuffled permutation with the Fisher-Yates algorithm.
 * @param size - The number of elements.
 * @param random - The source of randomness.
 * @returns A random permutation of 0 to size - 1.
 */
function shuffledRange(size: number, random: RandomSource): number[] {
  const values = Array.from({ length: size }, (_, i) => i);
  for (let i = size - 1; i > 0; i--) {
    const j = random(i + 1);
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

/**
 * Draws random orientations whose sum is a multiple of the modulo, the last one fixing the total.
 * @param size - The number of pieces.
 * @param modulo - The number of orientations of each piece.
 * @param random - The source of randomness.
 * @returns Uniformly random valid orientations.
 */
function randomOrientations(size: number, modulo: number, random: RandomSource): number[] {
  const values = Array.from({ length: size - 1 }, () => random(modulo));
  const total = values.reduce((sum, v) => sum + v, 0);
  values.push((modulo - (total % modulo)) % modulo);
  return values;
}

export interface PlacedPiece {
  readonly piece: number;
  readonly position: number;
  readonly orientation: number;
}

export interface StateConstraint {
  readonly corners?: readonly PlacedPiece[];
  readonly edges?: readonly PlacedPiece[];
}

interface Pieces {
  readonly permutation: number[];
  readonly orientation: number[];
  readonly free: number[];
}

/**
 * Places the fixed pieces of one kind, then the others at random positions with random orientations whose sum is valid.
 * @param count - The number of pieces of this kind.
 * @param modulo - The number of orientations of a piece.
 * @param fixed - The pieces whose position and orientation are imposed.
 * @param random - The source of randomness.
 * @returns The permutation and orientations by position, and the positions left free.
 */
function placePieces(
  count: number,
  modulo: number,
  fixed: readonly PlacedPiece[],
  random: RandomSource,
): Pieces {
  const permutation = new Array<number>(count).fill(-1);
  const orientation = new Array<number>(count).fill(0);
  const used = new Set<number>();
  for (const { piece, position, orientation: o } of fixed) {
    const inRange = [piece, position].every((v) => Number.isInteger(v) && v >= 0 && v < count);
    if (!inRange || !Number.isInteger(o) || o < 0 || o >= modulo)
      throw new RangeError(`Invalid placed piece ${piece} at ${position}`);
    if (used.has(piece) || permutation[position] !== -1)
      throw new RangeError(`Piece ${piece} or position ${position} is placed twice`);
    used.add(piece);
    permutation[position] = piece;
    orientation[position] = o;
  }
  const free = permutation.flatMap((p, position) => (p === -1 ? [position] : []));
  const pieces = shuffledRange(count, random).filter((piece) => !used.has(piece));
  free.forEach((position, i) => {
    permutation[position] = pieces[i];
    orientation[position] = random(modulo);
  });
  const total = orientation.reduce((sum, v) => sum + v, 0) % modulo;
  if (total !== 0) {
    if (free.length === 0) throw new RangeError('The placed pieces have an impossible orientation');
    const last = free[free.length - 1];
    orientation[last] = (orientation[last] + modulo - total) % modulo;
  }
  return { permutation, orientation, free };
}

/**
 * Draws a uniformly random state among the valid states where some pieces are at given positions and orientations.
 * Pieces and positions use the Kociemba numbering: corners URF UFL ULB UBR DFR DLF DBL DRB, edges UR UF UL UB DR DF DL DB FR FL BL BR.
 * @param random - The source of randomness.
 * @param constraint - The corners and edges to place; orientation 0 is the solved one.
 * @returns A valid random state that meets the constraint.
 */
export function constrainedState(random: RandomSource, constraint: StateConstraint): CubeState {
  const corners = placePieces(CORNER_COUNT, 3, constraint.corners ?? [], random);
  const edges = placePieces(EDGE_COUNT, 2, constraint.edges ?? [], random);
  if (permutationParity(corners.permutation) !== permutationParity(edges.permutation)) {
    const swap = edges.free.length >= 2 ? edges : corners.free.length >= 2 ? corners : null;
    if (!swap) throw new RangeError('The placed pieces have an impossible permutation');
    const [a, b] = swap.free;
    [swap.permutation[a], swap.permutation[b]] = [swap.permutation[b], swap.permutation[a]];
    [swap.orientation[a], swap.orientation[b]] = [swap.orientation[b], swap.orientation[a]];
  }
  return {
    cp: corners.permutation,
    co: corners.orientation,
    ep: edges.permutation,
    eo: edges.orientation,
  };
}
