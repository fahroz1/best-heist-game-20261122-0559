// Midnight Vault — the main loop: wires input, world, sound and rendering
// together, and stages deterministic screenshots when ?shot= is present.

import { VIEW } from './config.js';
import { attachInput, createInput } from './input.js';
import { drawWorld } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, stepWorld } from './world.js';
import {
  playAlarmSting,
  playBustedSound,
  playPickupSound,
  playWinSound,
  unlockAudio,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

let world;
if (shot) {
  // Staged shot: simulate synchronously, then paint one deterministic frame.
  world = stageShot(shot, seed);
} else {
  world = createWorld(seed);
}

const input = createInput();

function resizeCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = Math.round(VIEW.width * scale);
  canvas.height = Math.round(VIEW.height * scale);
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
}

function toWorldPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = VIEW.width / rect.width;
  const scaleY = VIEW.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

attachInput(input, canvas, toWorldPoint);
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function renderFrame() {
  ctx.setTransform(canvas.width / VIEW.width, 0, 0, canvas.height / VIEW.height, 0, 0);
  drawWorld(ctx, world);
}

let lastTime = performance.now();
let previousStrikes = world.strikes;
let previousLoot = world.lootTaken;
let previousPhase = world.phase;

function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  // In staged-shot mode the world is already simulated: paint it every
  // animation frame (headless Chrome only presents canvas frames driven
  // by requestAnimationFrame) but never step it further or take input.
  if (!shot) {
    if (input.startPressed) {
      input.startPressed = false;
      if (world.phase === 'title') {
        unlockAudio();
        world.phase = 'playing';
      }
    }
    if (input.restartPressed) {
      input.restartPressed = false;
      unlockAudio();
      const fresh = createWorld(seed);
      fresh.phase = 'playing';
      world = fresh;
      previousStrikes = 0;
      previousLoot = 0;
      previousPhase = 'playing';
    }

    if (input.clickTarget) {
      world.thief.moveTarget = input.clickTarget;
      input.clickTarget = null;
    }

    if (world.phase === 'playing' || world.phase === 'title') {
      stepWorld(world, input, dt);
    }

    // Sound cues on the moments that matter.
    if (world.strikes > previousStrikes) playAlarmSting();
    if (world.lootTaken > previousLoot) playPickupSound();
    if (world.phase === 'won' && previousPhase !== 'won') playWinSound();
    if (world.phase === 'busted' && previousPhase !== 'busted') playBustedSound();
  }
  previousStrikes = world.strikes;
  previousLoot = world.lootTaken;
  previousPhase = world.phase;

  renderFrame();
  requestAnimationFrame(tick);
}

renderFrame();
requestAnimationFrame(tick);
