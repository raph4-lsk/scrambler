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
