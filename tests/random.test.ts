import { afterEach, describe, expect, it, vi } from 'vitest';
import { cryptoRandom, seededRandom } from '@/random';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('seededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    const drawsA = Array.from({ length: 10 }, () => a(1000));
    const drawsB = Array.from({ length: 10 }, () => b(1000));
    expect(drawsA).toEqual(drawsB);
  });

  it('gives different sequences for different seeds', () => {
    const a = seededRandom(1);
    const b = seededRandom(2);
    expect(Array.from({ length: 10 }, () => a(1000))).not.toEqual(
      Array.from({ length: 10 }, () => b(1000)),
    );
  });

  it('accepts a zero seed', () => {
    const random = seededRandom(0);
    expect(new Set(Array.from({ length: 20 }, () => random(1000))).size).toBeGreaterThan(1);
  });

  it('draws every value of a small range evenly', () => {
    const random = seededRandom(7);
    const counts = [0, 0, 0, 0, 0, 0];
    const draws = 60000;
    for (let i = 0; i < draws; i++) {
      const value = random(6);
      counts[value] = (counts[value] ?? 0) + 1;
    }
    const expected = draws / 6;
    const chiSquare = counts.reduce((sum, count) => sum + (count - expected) ** 2 / expected, 0);
    expect(chiSquare).toBeLessThan(20.52);
  });

  it('rejects an invalid range', () => {
    const random = seededRandom(1);
    expect(() => random(0)).toThrow(RangeError);
    expect(() => random(2.5)).toThrow(RangeError);
    expect(() => random(2 ** 32 + 1)).toThrow(RangeError);
  });
});

describe('cryptoRandom', () => {
  it('draws integers in range', () => {
    const random = cryptoRandom();
    for (let i = 0; i < 1000; i++) {
      const value = random(12);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(12);
    }
  });

  it('explains how to fix a missing crypto', () => {
    vi.stubGlobal('crypto', undefined);
    expect(() => cryptoRandom()).toThrow(/expo-crypto/);
  });
});

describe('modulo bias', () => {
  it('rejects the draws that would bias the result', () => {
    const values = [2 ** 32 - 1, 5];
    vi.stubGlobal('crypto', {
      getRandomValues: (array: Uint32Array) => {
        array[0] = values.shift() ?? 0;
        return array;
      },
    });
    expect(cryptoRandom()(3)).toBe(2);
    expect(values).toEqual([]);
  });
});
