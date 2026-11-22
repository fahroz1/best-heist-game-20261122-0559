// Midnight Vault — configuration: room size, speeds, colours and tuning.
// One place holds every number the rest of the game reads, so balancing
// the heist means editing this file and nothing else.

export const VIEW = { width: 960, height: 600 };

export const WALL = 28; // thickness of the vault's outer wall, in pixels

export const THIEF = {
  radius: 11,
  speed: 132, // pixels per second while walking
  hideSpeedFactor: 0, // hiding roots the thief to the spot
};

export const GUARD = {
  radius: 12,
  patrolSpeed: 62,
  alertSpeed: 92, // how fast an alerted guard turns toward the thief
  coneRange: 195,
  coneHalfAngle: 0.65, // radians, about 37 degrees each side
  alertHoldSeconds: 1.6, // how long a guard stares after a strike
};

export const CAMERA = {
  coneRange: 225,
  coneHalfAngle: 0.5, // radians, about 29 degrees each side
  sweepHalfAngle: 0.62, // how far each camera swings from its base angle
  sweepSpeed: 0.55, // radians per second of sweep
};

// Alarm meter: 0 is calm, 100 is a strike. Three strikes bust the run.
export const ALARM = {
  riseGuardPerSecond: 72,
  riseCameraPerSecond: 52,
  fallPerSecond: 18,
  shadowFactor: 0.35, // detection while standing in a shadow patch
  hidingFactor: 0.5, // detection while holding Space to hide
  strikeReset: 50, // meter value after a strike lands
  maxStrikes: 3,
};

export const PLAY = {
  timeLimitSeconds: 120, // the vault locks down for good past this
  shotPlaySeconds: 18, // long enough to be mid-heist, short enough a loot target is still on the floor
  shotEndSeconds: 75, // cap for the busted screenshot's careless run
  shotStartSeconds: 4, // patrol time shown behind the title screen
};

// The room: cover the thief can hide behind (also blocks cone sightlines),
// shadow patches where the alarm rises slowly, loot, and the exit door.
export const ROOM = {
  cover: [
    { x: 280, y: 150, w: 150, h: 56, label: 'DISPLAY CASE' },
    { x: 530, y: 390, w: 150, h: 56, label: 'DISPLAY CASE' },
    { x: 170, y: 380, w: 54, h: 54, label: 'PILLAR' },
    { x: 736, y: 150, w: 54, h: 54, label: 'PILLAR' },
    { x: 410, y: 282, w: 140, h: 44, label: 'VAULT TABLE' },
  ],
  shadows: [
    { x: 88, y: 118, w: 150, h: 92 },
    { x: 722, y: 440, w: 150, h: 92 },
  ],
  loot: [
    { id: 'painting', name: 'Portrait of the Duchess', value: 40000, x: 480, y: 84, kind: 'painting' },
    { id: 'gold', name: 'Gold bars', value: 25000, x: 852, y: 300, kind: 'gold' },
    { id: 'diamond', name: 'The Midnight Diamond', value: 60000, x: 140, y: 96, kind: 'diamond' },
  ],
  exit: { x: 430, y: 536, w: 84, h: 34 },
  thiefStart: { x: 92, y: 538 },
};

export const GUARDS = [
  {
    name: 'Marco',
    waypoints: [
      { x: 240, y: 300 },
      { x: 720, y: 300 },
    ],
  },
  {
    name: 'Elena',
    waypoints: [
      { x: 480, y: 140 },
      { x: 480, y: 460 },
    ],
  },
  {
    name: 'Rosa',
    waypoints: [
      { x: 180, y: 480 },
      { x: 780, y: 480 },
    ],
  },
];

export const CAMERAS = [
  { name: 'CAM 1', x: 44, y: 44, baseAngle: Math.PI * 0.28, phase: 0 },
  { name: 'CAM 2', x: 916, y: 44, baseAngle: Math.PI * 0.72, phase: Math.PI * 0.6 },
];

export const PALETTE = {
  floor: '#0d1526',
  floorTile: '#111c33',
  wall: '#1d2b47',
  wallEdge: '#31456e',
  cover: '#22314f',
  coverEdge: '#3b548a',
  shadow: '#05080f',
  shadowEdge: '#2c3f63',
  thief: '#e8ecf4',
  thiefSuit: '#232a3d',
  guard: '#c0392b',
  guardCone: 'rgba(231, 76, 60, 0.20)',
  guardConeEdge: 'rgba(231, 76, 60, 0.55)',
  cameraCone: 'rgba(250, 219, 94, 0.16)',
  cameraConeEdge: 'rgba(250, 219, 94, 0.5)',
  cameraBody: '#d4c25a',
  lootGold: '#f5c542',
  lootGlow: 'rgba(245, 197, 66, 0.35)',
  exit: '#2ecc71',
  hudText: '#f2f5fa',
  hudDim: '#9fb0cc',
  alarmFill: '#e74c3c',
  alarmTrack: '#2a2430',
  title: '#f5c542',
};
