import type { RandomSource } from '../../random';
import { invertMoves } from './moves';
import { formatMoves } from './notation';
import { getPruningTables } from './pruning-tables';
import { randomState } from './random-state';
import { solve } from './search';

/**
 * Generates a random state 3x3 scramble: a uniformly random state, reached by the inverse of its solution.
 * @param random - The source of randomness, cryptoRandom for real scrambles.
 * @returns The scramble in WCA notation.
 */
export function randomScramble333(random: RandomSource): string {
  const solution = solve(randomState(random));
  if (!solution) throw new Error('No 3x3 solution found within the length limit');
  return formatMoves(invertMoves(solution));
}

/**
 * Builds the 3x3 tables ahead of time, so the first scramble is fast.
 * @returns Nothing.
 */
export function prepare333(): void {
  getPruningTables();
}
