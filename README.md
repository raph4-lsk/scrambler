<div align="center">
  <h1>@cubertimer/scrambler</h1>
  <p>Random state scrambles for speedcubing puzzles, following the WCA method.</p>
</div>

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

## Note

These scrambles follow the WCA method but are not official WCA scrambles. This project is not affiliated with the World Cube Association.

## License

[MIT](LICENSE)
