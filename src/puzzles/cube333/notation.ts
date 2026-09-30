import type { Amount, Face, Move } from './moves';

const MOVE_PATTERN = /^([URFDLB])(2|')?$/;
const SUFFIXES: Record<Amount, string> = { 1: '', 2: '2', 3: "'" };

/**
 * Parses a sequence of face turns written in WCA notation.
 * @param text - Moves separated by spaces, such as R U2 F'.
 * @returns The parsed moves; an empty text gives no move.
 */
export function parseMoves(text: string): Move[] {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  return tokens.map((token) => {
    const match = MOVE_PATTERN.exec(token);
    if (!match) throw new SyntaxError(`Invalid move "${token}"`);
    const amount: Amount = match[2] === '2' ? 2 : match[2] === "'" ? 3 : 1;
    return { face: match[1] as Face, amount };
  });
}

/**
 * Writes a sequence of face turns in WCA notation.
 * @param moves - The moves to write.
 * @returns The moves separated by single spaces, such as R U2 F'.
 */
export function formatMoves(moves: readonly Move[]): string {
  return moves.map((move) => move.face + SUFFIXES[move.amount]).join(' ');
}
