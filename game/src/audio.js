// Midnight Vault — sound, synthesized at runtime with the Web Audio API.
// No audio files: every blip and sting is an oscillator shaped in code.
// Audio only starts after a user gesture; staged screenshots stay silent.

let audioContext = null;

function ensureContext() {
  if (audioContext) return audioContext;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  audioContext = new Ctor();
  return audioContext;
}

export function unlockAudio() {
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

function tone(freq, startAt, duration, type, gainValue) {
  const ctx = ensureContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt);
  gain.gain.setValueAtTime(0, ctx.currentTime + startAt);
  gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + startAt);
  osc.stop(ctx.currentTime + startAt + duration + 0.05);
}

export function playPickupSound() {
  tone(880, 0, 0.12, 'sine', 0.12);
  tone(1318, 0.07, 0.16, 'sine', 0.1);
}

export function playAlarmSting() {
  tone(220, 0, 0.28, 'sawtooth', 0.14);
  tone(185, 0.16, 0.3, 'sawtooth', 0.14);
  tone(220, 0.36, 0.34, 'sawtooth', 0.12);
}

export function playWinSound() {
  tone(523, 0, 0.18, 'triangle', 0.12);
  tone(659, 0.12, 0.18, 'triangle', 0.12);
  tone(784, 0.24, 0.3, 'triangle', 0.12);
  tone(1046, 0.38, 0.5, 'triangle', 0.1);
}

export function playBustedSound() {
  tone(330, 0, 0.3, 'square', 0.08);
  tone(247, 0.22, 0.5, 'square', 0.08);
}
