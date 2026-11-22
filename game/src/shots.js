// Midnight Vault — screenshot staging.
// ?shot=start|play|end (with ?seed=N) replays the game's own rules on a
// fixed timestep, so the same seed always stages the same frame:
//   start — the title screen over a room whose patrols have run a few seconds
//   play  — a careful autopilot thief, twenty seconds into the heist
//   end   — a careless thief, busted (or out of time) — the game-over screen

import { PLAY } from './config.js';
import { carefulAutopilot, carelessAutopilot, createWorld, stepWorld } from './world.js';

const STEP = 1 / 60; // fixed sixty-hertz steps keep every shot deterministic

function runSteps(world, seconds, pilot) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i++) {
    if (world.phase !== 'playing') break;
    stepWorld(world, pilot(world), STEP);
  }
  return world;
}

export function stageShot(shot, seed) {
  if (shot === 'start') {
    // Patrols sweep behind the title screen; the thief waits at the door.
    const world = createWorld(seed);
    world.phase = 'title';
    for (let i = 0; i < Math.round(PLAY.shotStartSeconds / STEP); i++) {
      stepWorld(world, { left: false, right: false, up: false, down: false, hide: false }, STEP);
      world.time += STEP; // keep the title blink ticking
    }
    // Land exactly on the whole second so the start prompt is lit, not mid-blink.
    world.time = PLAY.shotStartSeconds;
    return world;
  }
  if (shot === 'play') {
    const world = createWorld(seed);
    world.phase = 'playing';
    runSteps(world, PLAY.shotPlaySeconds, carefulAutopilot);
    if (world.phase !== 'playing') {
      // The careful thief finished early: replay and freeze two seconds
      // before the getaway, so the shot still shows a heist in progress.
      const stopAt = Math.max(4, world.time - 2);
      const retry = createWorld(seed);
      retry.phase = 'playing';
      runSteps(retry, stopAt, carefulAutopilot);
      return retry;
    }
    return world;
  }
  if (shot === 'end') {
    // A careless thief should be busted. Patrol timing is periodic, so the
    // same walk can thread the cones or blunder into them depending on when
    // the thief leaves the door: try departure delays in order until one
    // run is busted. The delay is part of the shot, so the frame stays
    // reproducible.
    const IDLE = { left: false, right: false, up: false, down: false, hide: false };
    const delays = [3, 4, 14, 2, 5, 1, 6, 7, 8, 9, 10, 11, 12, 13, 0];
    for (const delay of delays) {
      const candidate = createWorld(seed);
      candidate.phase = 'playing';
      for (let i = 0; i < Math.round(delay / STEP); i++) {
        stepWorld(candidate, IDLE, STEP);
      }
      runSteps(candidate, PLAY.shotEndSeconds - delay, carelessAutopilot);
      if (candidate.phase === 'busted') return candidate;
    }
    // No delay busted in the cap: run the first delay out and let dawn
    // catch them if they are still at large.
    const world = createWorld(seed);
    world.phase = 'playing';
    for (let i = 0; i < Math.round(delays[0] / STEP); i++) {
      stepWorld(world, IDLE, STEP);
    }
    runSteps(world, PLAY.shotEndSeconds - delays[0], carelessAutopilot);
    if (world.phase === 'playing') {
      world.phase = 'busted';
      world.bustReason = 'The vault locked down at dawn — the crew left without you.';
    }
    return world;
  }
  return createWorld(seed);
}
