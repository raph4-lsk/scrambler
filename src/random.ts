export type RandomSource = (maxExclusive: number) => number;

const UINT32_RANGE = 2 ** 32;

interface CryptoLike {
  getRandomValues(array: Uint32Array): Uint32Array;
}

/**
 * Builds a uniform random source on top of a generator of 32 bit unsigned integers.
 * @param nextUint32 - Returns a uniformly distributed integer in [0, 2^32).
 * @returns A source returning uniform integers in [0, maxExclusive), without modulo bias.
 */
function fromUint32(nextUint32: () => number): RandomSource {
  return (maxExclusive) => {
    if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > UINT32_RANGE) {
      throw new RangeError(`maxExclusive must be an integer in [1, 2^32], got ${maxExclusive}`);
    }
    const limit = UINT32_RANGE - (UINT32_RANGE % maxExclusive);
    for (;;) {
      const value = nextUint32();
      if (value < limit) return value % maxExclusive;
    }
  };
}

/**
 * Returns a secure random source backed by crypto.getRandomValues, as required for real scrambles.
 * @returns A uniform random source.
 */
export function cryptoRandom(): RandomSource {
  const crypto = (globalThis as { crypto?: CryptoLike }).crypto;
  if (typeof crypto?.getRandomValues !== 'function') {
    throw new Error(
      'crypto.getRandomValues is not available. In React Native, install expo-crypto or react-native-get-random-values, or pass your own random source.',
    );
  }
  const buffer = new Uint32Array(1);
  return fromUint32(() => crypto.getRandomValues(buffer)[0] as number);
}

/**
 * Returns a deterministic random source for reproducible tests, never for real scrambles.
 * @param seed - Any integer; the same seed always gives the same sequence.
 * @returns A uniform random source based on xorshift32.
 */
export function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0 || 0x9e3779b9;
  return fromUint32(() => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state;
  });
}
