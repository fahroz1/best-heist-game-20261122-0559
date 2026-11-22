# Midnight Vault

[![Midnight Vault — make.fun bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![Midnight Vault — rank on make.fun](https://make.fun/badge/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![Midnight Vault — reward on make.fun](https://make.fun/badge/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**Midnight Vault** is a top-down 2D stealth heist game that runs entirely offline in a desktop browser from its own static files. You are a thief in a dark suit slipping through a museum vault after midnight: steal the painting, the gold bars and the Midnight Diamond, then reach the green exit — while three patrolling guards and two sweeping security cameras watch the room with visible vision cones. Standing in a lit cone fills the alarm meter; shadow patches and hiding slow it down. Fill the meter three times and the run is busted.

## How to play

- **Move:** WASD or arrow keys, or click anywhere to walk there.
- **Hide:** hold Space to crouch in place — cones spot you slower while hidden.
- **Restart:** R. **Start:** Enter.
- **Goal:** pocket all three loot items (worth $125,000 in total), then reach the green EXIT door. The exit stays locked until every item is taken.
- **Alarm:** the meter rises while any guard (red cone) or camera (yellow cone) can see you, and falls when you are out of sight. Cover blocks sightlines; the two dark shadow patches slow the rise. Three full meters means busted.

## How to run locally

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests — every file the game loads lives under `game/`.

## Screenshots

The three screenshots in `screenshots/` are deterministic renders of the game's own code, staged with `?shot=start|play|end` (see `shots.json`): the title screen over the live room, a careful autopilot mid-heist, and a careless thief getting busted.

## Layout

- `game/` — the playable game: `index.html` plus ES modules under `game/src/` (config, world/state, input, rendering, sound, screenshot staging, main loop).
- `screenshots/` — the three staged screenshots.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `serve.ts` — a tiny static server for local play-testing.

## License

MIT — see [LICENSE](LICENSE).
