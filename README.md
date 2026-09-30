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
import { prepare, randomScramble } from '@cubertimer/scrambler';

prepare('333');
const scramble = randomScramble('333');
```

In React Native, install expo-crypto or react-native-get-random-values first.

## Development

```bash
npm install
npm test
npm run build
```

## License

[MIT](LICENSE)
