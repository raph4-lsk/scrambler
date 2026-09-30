import { describe, expect, it } from 'vitest';
import { formatMoves, parseMoves } from '@/puzzles/cube333/notation';

describe('parseMoves', () => {
  it('reads quarter, half and counterclockwise turns', () => {
    expect(parseMoves("R U2 F'")).toEqual([
      { face: 'R', amount: 1 },
      { face: 'U', amount: 2 },
      { face: 'F', amount: 3 },
    ]);
  });

  it('ignores extra spaces', () => {
    expect(parseMoves('  D   L2  ')).toEqual([
      { face: 'D', amount: 1 },
      { face: 'L', amount: 2 },
    ]);
  });

  it('returns no move for an empty text', () => {
    expect(parseMoves('')).toEqual([]);
    expect(parseMoves('   ')).toEqual([]);
  });

  it('rejects anything outside face turns', () => {
    for (const invalid of ['x', 'Rw', 'r', "R2'", 'R3', 'M', 'U+']) {
      expect(() => parseMoves(invalid)).toThrow(SyntaxError);
    }
  });
});

describe('formatMoves', () => {
  it('writes moves in WCA notation', () => {
    expect(
      formatMoves([
        { face: 'B', amount: 3 },
        { face: 'D', amount: 2 },
        { face: 'L', amount: 1 },
      ]),
    ).toBe("B' D2 L");
  });

  it('round trips with parseMoves', () => {
    const text = "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2";
    expect(formatMoves(parseMoves(text))).toBe(text);
  });
});
