import { prepare333, randomScramble333 } from './puzzles/cube333/scramble';
import { cryptoRandom, type RandomSource } from './random';

export type EventId = '333';

export interface ScrambleOptions {
  readonly random?: RandomSource;
}

/**
 * Generates a random state scramble for a WCA event, following the WCA method.
 * @param eventId - The WCA event identifier, such as 333.
 * @param options - An optional random source; crypto.getRandomValues is used by default.
 * @returns The scramble in WCA notation.
 */
export function randomScramble(eventId: EventId, options: ScrambleOptions = {}): string {
  const random = options.random ?? cryptoRandom();
  switch (eventId) {
    case '333':
      return randomScramble333(random);
    default:
      throw new RangeError(`Unsupported event ${String(eventId)}`);
  }
}

/**
 * Builds the tables of an event ahead of time, for example at app launch, so the first scramble is fast.
 * @param eventId - The WCA event identifier, such as 333.
 * @returns Nothing.
 */
export function prepare(eventId: EventId): void {
  switch (eventId) {
    case '333':
      prepare333();
      return;
    default:
      throw new RangeError(`Unsupported event ${String(eventId)}`);
  }
}
