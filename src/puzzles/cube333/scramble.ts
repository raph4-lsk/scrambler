import type { RandomSource } from '../../random';
import { invertMoves } from './moves';
import { formatMoves } from './notation';
import { getPruningTables, pruningTablesSteps } from './pruning-tables';
import { runInSlices, type SliceOptions } from '../../steps';
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

/**
 * Builds the 3x3 tables in short slices, so the host stays responsive while they are built.
 * @param options - The slice length in milliseconds, and how to yield to the host.
 * @returns A promise resolved once the tables are ready.
 */
export async function prepare333Async(options?: SliceOptions): Promise<void> {
  await runInSlices(pruningTablesSteps(), options);
}
