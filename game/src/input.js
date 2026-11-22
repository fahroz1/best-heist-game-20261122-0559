// Midnight Vault — keyboard and mouse input.
// WASD or arrow keys move, a click sets a move target, Space hides,
// R restarts, Enter starts. The game reads this plain object each tick.

export function createInput() {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    hide: false,
    restartPressed: false,
    startPressed: false,
  };
}

const KEYMAP = {
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  Space: 'hide',
};

export function attachInput(input, canvas, toWorldPoint) {
  window.addEventListener('keydown', (event) => {
    const field = KEYMAP[event.code];
    if (field) {
      input[field] = true;
      event.preventDefault();
    }
    if (event.code === 'KeyR') input.restartPressed = true;
    if (event.code === 'Enter') input.startPressed = true;
  });
  window.addEventListener('keyup', (event) => {
    const field = KEYMAP[event.code];
    if (field) input[field] = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const point = toWorldPoint(event.clientX, event.clientY);
    if (point) {
      // The world reads moveTarget directly off the thief; stash it here
      // and let main.js hand it over each tick.
      input.clickTarget = point;
    }
  });
  window.addEventListener('blur', () => {
    input.left = false;
    input.right = false;
    input.up = false;
    input.down = false;
    input.hide = false;
  });
}
