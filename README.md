# @cubertimer/scrambler

Random state scrambles for speedcubing puzzles, following the WCA method. Pure TypeScript, no dependency, works in React Native, Node and the browser.

> Status: early development. 3x3 only, not published yet.

## Why

Every reference scrambler is either browser only or GPL licensed:

| Library                        | Limitation                                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| TNoodle (official WCA program) | Java, GPL-3.0                                                                                                                          |
| min2phase, csTimer             | GPL-3.0, which is incompatible with the App Store                                                                                      |
| cubing.js                      | Needs a Web Worker, import.meta and crypto.getRandomValues, so it does not run in React Native, even inside a WebView bundled by Metro |

This library fills that gap: a permissively licensed scrambler that runs on any JavaScript engine, including Hermes.

## Principles

- **Original code.** Built from public descriptions of the algorithms and from the WCA Regulations. No code from GPL projects is read or copied.
- **Pure TypeScript.** No platform API in the core. Randomness is injected.
- **Secure by default.** Real scrambles use crypto.getRandomValues. A seeded source exists for reproducible tests only.
- **Verified.** Every puzzle is tested for validity (the scramble reaches the drawn state), uniformity and speed.

## Not official

The WCA requires scrambles from its official program (TNoodle) in competition. This library follows the same method, but its scrambles are not official WCA scrambles. WCA is a trademark of the World Cube Association; this project is not affiliated with it.

## Usage

```ts
import { prepare, randomScramble } from '@cubertimer/scrambler';

prepare('333'); // optional: build the tables ahead of time, for example at app launch
const scramble = randomScramble('333'); // for example "D' L2 F2 D' L2 U F2 R2 U B2 ..."
```

A scramble is built in three steps: draw a uniformly random cube state with a secure random source, solve it with Kociemba's two-phase algorithm, and invert the solution. Scrambles are at most 22 moves long.

| Step                  | Node (Apple M3 Pro)                       |
| --------------------- | ----------------------------------------- |
| prepare('333')        | about 400 ms, once                        |
| randomScramble('333') | about 2 ms median, under 30 ms worst case |

For reproducible tests only, pass a seeded source: `randomScramble('333', { random: seededRandom(42) })`.

## Roadmap

| Version | Content                                     |
| ------- | ------------------------------------------- |
| 0.1     | Random source, 3x3 random state (two-phase) |
| 0.2     | 2x2, Pyraminx, Skewb                        |
| 0.3     | 5x5, 6x6, 7x7, Megaminx, Clock              |
| 0.4     | Square-1                                    |
| 0.5     | 4x4 random state                            |
| 1.0     | Every WCA event, stable API                 |

## Usage in React Native

Hermes has no crypto.getRandomValues. Install a polyfill such as expo-crypto or react-native-get-random-values, or pass your own random source. Run generation off the JS thread (for example in a worklet runtime) so the first table build does not freeze the UI.

## Development

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

## License

[MIT](LICENSE)
