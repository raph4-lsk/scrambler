<div align="center">
  <h1>@cubertimer/scrambler</h1>
  <p>Random state scrambles for speedcubing puzzles, following the WCA method.</p>
</div>

## Why

Existing scramblers do not fit React Native apps: the reference ones (TNoodle, min2phase, csTimer) are GPL licensed, and cubing.js needs browser APIs that React Native does not provide. This library brings random state scrambles to React Native under the MIT license.

## Features

- Random state 3x3 scrambles (two-phase algorithm)
- Pure TypeScript, no dependency
- Runs in React Native, Node and the browser
- Secure randomness by default

## Usage

```ts
import { prepareAsync, randomScramble } from '@cubertimer/scrambler';

await prepareAsync('333');
const scramble = randomScramble('333');
```

prepareAsync builds the tables in short slices so the app stays responsive. Use prepare to build them at once.

In React Native, install expo-crypto or react-native-get-random-values first.

### Constrained scrambles

A 3x3 scramble can keep some pieces at given positions and orientations, the rest of the state staying uniformly random. This is useful for training, for example a cross of a chosen difficulty.

```ts
const scramble = randomScramble('333', {
  constraint: {
    edges: [{ piece: 4, position: 0, orientation: 1 }],
  },
});
```

Pieces and positions use the Kociemba numbering: corners URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB (0 to 7) and edges UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR (0 to 11). Orientation 0 is the solved one. An impossible constraint throws a RangeError.

## Development

```bash
npm install
npm test
npm run build
```

## License

[MIT](LICENSE)
