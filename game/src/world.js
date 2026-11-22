// Midnight Vault — the world: the room, the thief, the guards, the cameras,
// the loot and the alarm rules. Everything the game simulates lives here;
// rendering only reads this state, it never mutates it.

import {
  ALARM,
  CAMERA,
  CAMERAS,
  GUARD,
  GUARDS,
  PLAY,
  ROOM,
  THIEF,
  VIEW,
  WALL,
} from './config.js';
import { makeSeededRandom } from './random.js';

export function createWorld(seed) {
  const random = makeSeededRandom(seed);
  return {
    seed,
    random,
    phase: 'title', // title | playing | won | busted
    time: 0,
    alarm: 0,
    strikes: 0,
    lootTaken: 0,
    lootValue: 0,
    bustReason: '',
    spottedFlash: 0, // seconds left of the red "SPOTTED!" flash
    thief: {
      x: ROOM.thiefStart.x,
      y: ROOM.thiefStart.y,
      hiding: false,
      moveTarget: null,
      facing: -Math.PI / 2,
    },
    guards: GUARDS.map((g) => ({
      name: g.name,
      waypoints: g.waypoints,
      leg: 0,
      x: g.waypoints[0].x,
      y: g.waypoints[0].y,
      angle: Math.atan2(
        g.waypoints[1].y - g.waypoints[0].y,
        g.waypoints[1].x - g.waypoints[0].x,
      ),
      alertTimer: 0,
      seen: false,
    })),
    cameras: CAMERAS.map((c) => ({
      name: c.name,
      x: c.x,
      y: c.y,
      baseAngle: c.baseAngle,
      phase: c.phase,
      angle: c.baseAngle,
      seen: false,
    })),
    loot: ROOM.loot.map((item) => ({ ...item, taken: false, bob: random() * Math.PI * 2 })),
  };
}

export function lootTotal(world) {
  return world.loot.length;
}

export function lootValueTotal(world) {
  return world.loot.reduce((sum, item) => sum + item.value, 0);
}

export function allLootTaken(world) {
  return world.loot.every((item) => item.taken);
}

// --- geometry helpers -------------------------------------------------------

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

// Does the segment from (ax, ay) to (bx, by) cross the rectangle?
function segmentHitsRect(ax, ay, bx, by, rect) {
  const dx = bx - ax;
  const dy = by - ay;
  let tMin = 0;
  let tMax = 1;
  if (dx === 0) {
    if (ax < rect.x || ax > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - ax) / dx;
    let t2 = (rect.x + rect.w - ax) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (dy === 0) {
    if (ay < rect.y || ay > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - ay) / dy;
    let t2 = (rect.y + rect.h - ay) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

function sightBlocked(ax, ay, bx, by) {
  return ROOM.cover.some((rect) => segmentHitsRect(ax, ay, bx, by, rect));
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function thiefInShadow(world) {
  return ROOM.shadows.some((zone) => pointInRect(world.thief.x, world.thief.y, zone));
}

// Is the thief inside a watcher's cone, with a clear line of sight?
function coneSeesThief(wx, wy, angle, range, halfAngle, world) {
  const thief = world.thief;
  const dist = distance(wx, wy, thief.x, thief.y);
  const effectiveRange = range * (thief.hiding ? 0.7 : 1);
  if (dist > effectiveRange) return false;
  let delta = Math.atan2(thief.y - wy, thief.x - wx) - angle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  if (Math.abs(delta) > halfAngle) return false;
  return !sightBlocked(wx, wy, thief.x, thief.y);
}

// --- movement and collision -------------------------------------------------

function resolveCircleAgainstRect(circle, rect) {
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= circle.radius * circle.radius) return;
  if (distSq === 0) {
    circle.y = rect.y - circle.radius;
    return;
  }
  const dist = Math.sqrt(distSq);
  const push = (circle.radius - dist) / dist;
  circle.x += dx * push;
  circle.y += dy * push;
}

function moveThief(world, dx, dy, dt) {
  const thief = world.thief;
  if (thief.hiding) return;
  const length = Math.hypot(dx, dy);
  if (length === 0) return;
  thief.x += (dx / length) * THIEF.speed * dt;
  thief.y += (dy / length) * THIEF.speed * dt;
  thief.facing = Math.atan2(dy, dx);
  thief.x = clamp(thief.x, WALL + THIEF.radius, VIEW.width - WALL - THIEF.radius);
  thief.y = clamp(thief.y, WALL + THIEF.radius, VIEW.height - WALL - THIEF.radius);
  // Push the thief out of every cover rectangle.
  for (const rect of ROOM.cover) {
    const proxy = { x: thief.x, y: thief.y, radius: THIEF.radius };
    const beforeX = proxy.x;
    const beforeY = proxy.y;
    resolveCircleAgainstRect(proxy, rect);
    thief.x += proxy.x - beforeX;
    thief.y += proxy.y - beforeY;
  }
}

// --- the simulation step ----------------------------------------------------

export function stepWorld(world, input, dt) {
  if (world.phase !== 'playing') {
    // Patrols and cameras still sweep behind the title screen.
    stepPatrols(world, dt);
    return;
  }

  world.time += dt;
  if (world.spottedFlash > 0) world.spottedFlash -= dt;

  // Thief movement: keys first, then a clicked move target.
  const thief = world.thief;
  thief.hiding = Boolean(input.hide);
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (mx !== 0 || my !== 0) {
    thief.moveTarget = null;
    moveThief(world, mx, my, dt);
  } else if (thief.moveTarget) {
    const dx = thief.moveTarget.x - thief.x;
    const dy = thief.moveTarget.y - thief.y;
    if (Math.hypot(dx, dy) < 6) {
      thief.moveTarget = null;
    } else {
      moveThief(world, dx, dy, dt);
    }
  }

  stepPatrols(world, dt);

  // Detection: guards and cameras watch the thief.
  const inShadow = thiefInShadow(world);
  let seenByGuard = false;
  let seenByCamera = false;
  for (const guard of world.guards) {
    guard.seen = coneSeesThief(guard.x, guard.y, guard.angle, GUARD.coneRange, GUARD.coneHalfAngle, world);
    if (guard.seen) seenByGuard = true;
  }
  for (const camera of world.cameras) {
    camera.seen = coneSeesThief(camera.x, camera.y, camera.angle, CAMERA.coneRange, CAMERA.coneHalfAngle, world);
    if (camera.seen) seenByCamera = true;
  }

  let rise = 0;
  if (seenByGuard) rise += ALARM.riseGuardPerSecond;
  if (seenByCamera) rise += ALARM.riseCameraPerSecond;
  if (rise > 0) {
    if (inShadow) rise *= ALARM.shadowFactor;
    if (thief.hiding) rise *= ALARM.hidingFactor;
    world.alarm = Math.min(100, world.alarm + rise * dt);
  } else {
    world.alarm = Math.max(0, world.alarm - ALARM.fallPerSecond * dt);
  }

  // A full meter is a strike: the guards stare, the meter drops halfway.
  if (world.alarm >= 100) {
    world.strikes += 1;
    world.alarm = ALARM.strikeReset;
    world.spottedFlash = 1.2;
    for (const guard of world.guards) guard.alertTimer = GUARD.alertHoldSeconds;
    if (world.strikes >= ALARM.maxStrikes) {
      world.phase = 'busted';
      world.bustReason = 'Spotted three times — the guards called it in.';
      return;
    }
  }

  // Loot: step close and it is pocketed.
  for (const item of world.loot) {
    if (item.taken) continue;
    if (distance(thief.x, thief.y, item.x, item.y) < THIEF.radius + 20) {
      item.taken = true;
      world.lootTaken += 1;
      world.lootValue += item.value;
    }
  }

  // Exit: only opens once every loot item is pocketed.
  if (allLootTaken(world) && pointInRect(thief.x, thief.y, ROOM.exit)) {
    world.phase = 'won';
    return;
  }

  if (world.time >= PLAY.timeLimitSeconds) {
    world.phase = 'busted';
    world.bustReason = 'The vault locked down at dawn — the crew left without you.';
  }
}

function stepPatrols(world, dt) {
  for (const guard of world.guards) {
    if (guard.alertTimer > 0) {
      // An alerted guard stops patrolling and stares at the thief.
      guard.alertTimer -= dt;
      guard.angle = Math.atan2(world.thief.y - guard.y, world.thief.x - guard.x);
      continue;
    }
    const target = guard.waypoints[(guard.leg + 1) % guard.waypoints.length];
    const dx = target.x - guard.x;
    const dy = target.y - guard.y;
    const dist = Math.hypot(dx, dy);
    const step = GUARD.patrolSpeed * dt;
    if (dist <= step) {
      guard.x = target.x;
      guard.y = target.y;
      guard.leg = (guard.leg + 1) % guard.waypoints.length;
    } else {
      guard.x += (dx / dist) * step;
      guard.y += (dy / dist) * step;
      guard.angle = Math.atan2(dy, dx);
    }
  }
  for (const camera of world.cameras) {
    const sweep = Math.sin(world.time * CAMERA.sweepSpeed + camera.phase) * CAMERA.sweepHalfAngle;
    camera.angle = camera.baseAngle + sweep;
  }
}

// --- autopilot (drives the staged screenshots) ------------------------------

// A careful thief: heads for the nearest loot, but freezes in shadow and
// sidesteps away when a cone is on them.
export function carefulAutopilot(world) {
  const input = { left: false, right: false, up: false, down: false, hide: false };
  const thief = world.thief;
  const target = nearestLoot(world);
  if (!target) {
    // Everything is pocketed: walk to the exit.
    return steerToward(world, ROOM.exit.x + ROOM.exit.w / 2, ROOM.exit.y + ROOM.exit.h / 2, input);
  }
  const watched = watcherBearingDown(world);
  if (watched && !thiefInShadow(world)) {
    // A cone is on us: break away from its source, toward the nearest shadow.
    const shadow = nearestShadow(world);
    const awayX = thief.x - watched.x;
    const awayY = thief.y - watched.y;
    const blendX = awayX + (shadow.x - thief.x) * 0.6;
    const blendY = awayY + (shadow.y - thief.y) * 0.6;
    return steerToward(world, thief.x + blendX, thief.y + blendY, input);
  }
  if (watched && thiefInShadow(world)) {
    input.hide = true; // hold still in the dark until the cone passes
    return input;
  }
  return steerToward(world, target.x, target.y, input);
}

// A careless thief: walks straight at the nearest loot, cones be damned.
export function carelessAutopilot(world) {
  const input = { left: false, right: false, up: false, down: false, hide: false };
  const target = nearestLoot(world);
  if (!target) {
    return steerToward(world, ROOM.exit.x + ROOM.exit.w / 2, ROOM.exit.y + ROOM.exit.h / 2, input);
  }
  return steerToward(world, target.x, target.y, input);
}

function nearestLoot(world) {
  let best = null;
  let bestDist = Infinity;
  for (const item of world.loot) {
    if (item.taken) continue;
    const dist = distance(world.thief.x, world.thief.y, item.x, item.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = item;
    }
  }
  return best;
}

function nearestShadow(world) {
  let best = ROOM.shadows[0];
  let bestDist = Infinity;
  for (const zone of ROOM.shadows) {
    const cx = zone.x + zone.w / 2;
    const cy = zone.y + zone.h / 2;
    const dist = distance(world.thief.x, world.thief.y, cx, cy);
    if (dist < bestDist) {
      bestDist = dist;
      best = { x: cx, y: cy };
    }
  }
  return best;
}

// Which guard or camera currently has the thief in its cone, if any?
function watcherBearingDown(world) {
  for (const guard of world.guards) {
    if (guard.seen) return { x: guard.x, y: guard.y };
  }
  for (const camera of world.cameras) {
    if (camera.seen) return { x: camera.x, y: camera.y };
  }
  return null;
}

function steerToward(world, tx, ty, input) {
  const dx = tx - world.thief.x;
  const dy = ty - world.thief.y;
  if (Math.abs(dx) > 4) input[dx > 0 ? 'right' : 'left'] = true;
  if (Math.abs(dy) > 4) input[dy > 0 ? 'down' : 'up'] = true;
  return input;
}
