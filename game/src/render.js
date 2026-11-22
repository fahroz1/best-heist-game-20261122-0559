// Midnight Vault — rendering: everything drawn on the one canvas, from
// the vault floor to the HUD. The draw functions only read world state.

import { ALARM, CAMERA, GUARD, PALETTE, ROOM, VIEW, WALL } from './config.js';
import { allLootTaken, lootTotal, lootValueTotal, thiefInShadow } from './world.js';

function money(value) {
  return '$' + value.toLocaleString('en-US');
}

export function drawWorld(ctx, world) {
  drawFloor(ctx);
  drawShadows(ctx);
  drawExit(ctx, world);
  drawCover(ctx);
  drawLoot(ctx, world);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawThief(ctx, world);
  drawHud(ctx, world);
  drawLegend(ctx);
  if (world.spottedFlash > 0 && world.phase === 'playing') drawSpottedFlash(ctx, world);
  if (world.phase === 'title') drawTitleScreen(ctx, world);
  if (world.phase === 'won') drawWinScreen(ctx, world);
  if (world.phase === 'busted') drawBustedScreen(ctx, world);
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Faint floor tiles so the room reads at a glance.
  ctx.strokeStyle = PALETTE.floorTile;
  ctx.lineWidth = 1;
  for (let x = WALL + 40; x < VIEW.width - WALL; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, WALL);
    ctx.lineTo(x, VIEW.height - WALL);
    ctx.stroke();
  }
  for (let y = WALL + 40; y < VIEW.height - WALL; y += 40) {
    ctx.beginPath();
    ctx.moveTo(WALL, y);
    ctx.lineTo(VIEW.width - WALL, y);
    ctx.stroke();
  }
  // Outer wall.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW.width, WALL);
  ctx.fillRect(0, VIEW.height - WALL, VIEW.width, WALL);
  ctx.fillRect(0, 0, WALL, VIEW.height);
  ctx.fillRect(VIEW.width - WALL, 0, WALL, VIEW.height);
  ctx.strokeStyle = PALETTE.wallEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(WALL, WALL, VIEW.width - WALL * 2, VIEW.height - WALL * 2);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('M I D N I G H T   V A U L T', VIEW.width / 2, 19);
}

function drawShadows(ctx) {
  for (const zone of ROOM.shadows) {
    ctx.fillStyle = PALETTE.shadow;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeStyle = PALETTE.shadowEdge;
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    ctx.setLineDash([]);
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHADOW — SAFE', zone.x + zone.w / 2, zone.y + zone.h / 2 + 4);
  }
}

function drawExit(ctx, world) {
  const exit = ROOM.exit;
  const open = allLootTaken(world);
  ctx.fillStyle = open ? PALETTE.exit : '#3a4a35';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = open ? '#a9f0c2' : PALETTE.hudDim;
  ctx.lineWidth = 2;
  ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = open ? '#062b14' : PALETTE.hudDim;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT — GO!' : 'LOCKED', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5);
}

function drawCover(ctx) {
  for (const rect of ROOM.cover) {
    ctx.fillStyle = PALETTE.cover;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = PALETTE.coverEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(rect.label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 3);
  }
}

function drawLoot(ctx, world) {
  for (const item of world.loot) {
    if (item.taken) continue;
    const pulse = 0.7 + 0.3 * Math.sin(world.time * 3 + item.bob);
    const glowRadius = 34 + 6 * pulse;
    const glow = ctx.createRadialGradient(item.x, item.y, 4, item.x, item.y, glowRadius);
    glow.addColorStop(0, PALETTE.lootGlow);
    glow.addColorStop(1, 'rgba(245, 197, 66, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(item.x, item.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    // Marker ring and the item itself.
    ctx.strokeStyle = PALETTE.lootGold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.lootGold;
    if (item.kind === 'painting') {
      ctx.fillRect(item.x - 11, item.y - 8, 22, 16);
      ctx.fillStyle = '#7a4a21';
      ctx.fillRect(item.x - 7, item.y - 4, 14, 8);
    } else if (item.kind === 'gold') {
      ctx.fillRect(item.x - 11, item.y + 2, 22, 7);
      ctx.fillRect(item.x - 8, item.y - 5, 16, 7);
      ctx.fillRect(item.x - 4, item.y - 11, 9, 6);
    } else {
      // Diamond: a faceted gem.
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 11);
      ctx.lineTo(item.x + 10, item.y - 2);
      ctx.lineTo(item.x, item.y + 11);
      ctx.lineTo(item.x - 10, item.y - 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.name.toUpperCase(), item.x, item.y - 26);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = '11px sans-serif';
    ctx.fillText(money(item.value), item.x, item.y + 30);
  }
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle - halfAngle) * range, y + Math.sin(angle - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle + halfAngle) * range, y + Math.sin(angle + halfAngle) * range);
  ctx.stroke();
}

function drawGuards(ctx, world) {
  for (const guard of world.guards) {
    drawCone(
      ctx, guard.x, guard.y, guard.angle,
      GUARD.coneRange, GUARD.coneHalfAngle,
      guard.seen ? 'rgba(231, 76, 60, 0.38)' : PALETTE.guardCone,
      guard.seen ? '#ff6b5e' : PALETTE.guardConeEdge,
    );
    // Guard body: red uniform, facing dot, name tag.
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7b1d12';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffd9d4';
    ctx.beginPath();
    ctx.arc(
      guard.x + Math.cos(guard.angle) * (GUARD.radius - 3),
      guard.y + Math.sin(guard.angle) * (GUARD.radius - 3),
      3.5, 0, Math.PI * 2,
    );
    ctx.fill();
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffb3ab';
    ctx.fillText('GUARD ' + guard.name.toUpperCase(), guard.x, guard.y - GUARD.radius - 6);
    if (guard.seen) {
      ctx.fillStyle = '#ff6b5e';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('!', guard.x, guard.y - GUARD.radius - 18);
    }
  }
}

function drawCameras(ctx, world) {
  for (const camera of world.cameras) {
    drawCone(
      ctx, camera.x, camera.y, camera.angle,
      CAMERA.coneRange, CAMERA.coneHalfAngle,
      camera.seen ? 'rgba(250, 219, 94, 0.32)' : PALETTE.cameraCone,
      camera.seen ? '#ffe98a' : PALETTE.cameraConeEdge,
    );
    ctx.fillStyle = PALETTE.cameraBody;
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a7a2e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#3a3410';
    ctx.beginPath();
    ctx.arc(
      camera.x + Math.cos(camera.angle) * 6,
      camera.y + Math.sin(camera.angle) * 6,
      3, 0, Math.PI * 2,
    );
    ctx.fill();
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f7e98a';
    ctx.fillText(camera.name, camera.x, camera.y + 22);
  }
}

function drawThief(ctx, world) {
  const thief = world.thief;
  if (thief.moveTarget) {
    ctx.strokeStyle = 'rgba(232, 236, 244, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(thief.moveTarget.x, thief.moveTarget.y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(thief.moveTarget.x - 10, thief.moveTarget.y);
    ctx.lineTo(thief.moveTarget.x + 10, thief.moveTarget.y);
    ctx.moveTo(thief.moveTarget.x, thief.moveTarget.y - 10);
    ctx.lineTo(thief.moveTarget.x, thief.moveTarget.y + 10);
    ctx.stroke();
  }
  // Thief: dark suit, pale face, a gold tie — the one light in the dark.
  ctx.fillStyle = PALETTE.thiefSuit;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.thief;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.lootGold;
  ctx.beginPath();
  ctx.moveTo(thief.x + Math.cos(thief.facing) * 4, thief.y + Math.sin(thief.facing) * 4);
  ctx.lineTo(
    thief.x + Math.cos(thief.facing + 2.5) * 9,
    thief.y + Math.sin(thief.facing + 2.5) * 9,
  );
  ctx.lineTo(
    thief.x + Math.cos(thief.facing - 2.5) * 9,
    thief.y + Math.sin(thief.facing - 2.5) * 9,
  );
  ctx.closePath();
  ctx.fill();
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.hudText;
  ctx.fillText(thief.hiding ? 'HIDING' : 'YOU', thief.x, thief.y - 17);
}

function drawHud(ctx, world) {
  // Top bar: loot, alarm meter, timer, value.
  ctx.fillStyle = 'rgba(5, 8, 15, 0.85)';
  ctx.fillRect(0, VIEW.height - 34, VIEW.width, 34);
  ctx.strokeStyle = PALETTE.wallEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, VIEW.height - 34);
  ctx.lineTo(VIEW.width, VIEW.height - 34);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = PALETTE.lootGold;
  ctx.fillText(`LOOT ${world.lootTaken}/${lootTotal(world)}`, 16, VIEW.height - 12);
  ctx.fillStyle = PALETTE.hudText;
  ctx.fillText(money(world.lootValue), 108, VIEW.height - 12);

  // Alarm meter.
  const meterX = 250;
  const meterW = 300;
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('ALARM', meterX, VIEW.height - 12);
  ctx.fillStyle = PALETTE.alarmTrack;
  ctx.fillRect(meterX + 62, VIEW.height - 26, meterW, 14);
  ctx.fillStyle = world.alarm > 70 ? '#ff3b30' : PALETTE.alarmFill;
  ctx.fillRect(meterX + 62, VIEW.height - 26, meterW * (world.alarm / 100), 14);
  ctx.strokeStyle = PALETTE.hudDim;
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX + 62, VIEW.height - 26, meterW, 14);
  // Strike pips.
  for (let i = 0; i < ALARM.maxStrikes; i++) {
    ctx.beginPath();
    ctx.arc(meterX + 62 + meterW + 16 + i * 20, VIEW.height - 19, 6, 0, Math.PI * 2);
    ctx.fillStyle = i < world.strikes ? '#ff3b30' : '#3a3f4d';
    ctx.fill();
    ctx.strokeStyle = PALETTE.hudDim;
    ctx.stroke();
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 14px sans-serif';
  const minutes = Math.floor(world.time / 60);
  const seconds = Math.floor(world.time % 60);
  ctx.fillText(`TIME ${minutes}:${String(seconds).padStart(2, '0')}`, VIEW.width - 16, VIEW.height - 12);

  // "Seen" warning while a cone is on the thief.
  const seen = world.guards.some((g) => g.seen) || world.cameras.some((c) => c.seen);
  if (seen && world.phase === 'playing') {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b5e';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('SEEN! GET OUT OF THE LIGHT', VIEW.width / 2, 52);
  }
  if (thiefInShadow(world) && world.phase === 'playing') {
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('IN SHADOW — ALARM RISES SLOWLY', VIEW.width / 2, 70);
  }
}

function drawLegend(ctx) {
  // Bottom-left, clear of the exit door that sits bottom-centre.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '11px sans-serif';
  ctx.fillText(
    'WASD / arrows — move   ·   Click — walk there   ·   Space — hide   ·   R — restart',
    36,
    VIEW.height - 40,
  );
}

function drawSpottedFlash(ctx, world) {
  ctx.fillStyle = `rgba(231, 76, 60, ${0.14 * (world.spottedFlash / 1.2)})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6b5e';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('SPOTTED!', VIEW.width / 2, VIEW.height / 2 - 60);
}

function dimScreen(ctx) {
  ctx.fillStyle = 'rgba(3, 6, 12, 0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function drawTitleScreen(ctx, world) {
  dimScreen(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.title;
  ctx.font = 'bold 54px sans-serif';
  ctx.fillText('MIDNIGHT VAULT', VIEW.width / 2, 150);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '18px sans-serif';
  ctx.fillText('One thief. One vault. Three treasures. Get in, get rich, get out.', VIEW.width / 2, 190);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = PALETTE.hudDim;
  ctx.fillText('Steal the painting, the gold and the diamond — then reach the green EXIT.', VIEW.width / 2, 240);
  ctx.fillText('Red cones are guard eyes, yellow cones are cameras. Light fills the alarm;', VIEW.width / 2, 266);
  ctx.fillText('shadow and hiding slow it down. Three full alarms and the run is busted.', VIEW.width / 2, 292);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('WASD / arrows or click to move  ·  Space to hide  ·  R to restart', VIEW.width / 2, 340);
  ctx.fillStyle = PALETTE.title;
  ctx.font = 'bold 22px sans-serif';
  const blink = Math.floor(world.time * 2) % 2 === 0;
  if (blink) ctx.fillText('PRESS ENTER TO START THE HEIST', VIEW.width / 2, 400);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '13px sans-serif';
  ctx.fillText(`Total loot on the table: ${money(lootValueTotal(world))}`, VIEW.width / 2, 440);
}

function drawWinScreen(ctx, world) {
  dimScreen(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.exit;
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('CLEAN GETAWAY!', VIEW.width / 2, 200);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '20px sans-serif';
  ctx.fillText(`You slipped out with ${money(world.lootValue)} of loot.`, VIEW.width / 2, 250);
  const minutes = Math.floor(world.time / 60);
  const seconds = Math.floor(world.time % 60);
  ctx.fillText(`Time: ${minutes}:${String(seconds).padStart(2, '0')}   ·   Strikes: ${world.strikes}`, VIEW.width / 2, 284);
  ctx.fillStyle = PALETTE.title;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('PRESS R TO RUN IT AGAIN', VIEW.width / 2, 340);
}

function drawBustedScreen(ctx, world) {
  dimScreen(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6b5e';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('BUSTED!', VIEW.width / 2, 200);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '18px sans-serif';
  ctx.fillText(world.bustReason, VIEW.width / 2, 246);
  ctx.fillText(
    `Loot pocketed: ${money(world.lootValue)} of ${money(lootValueTotal(world))}   ·   Time: ${Math.floor(world.time)}s`,
    VIEW.width / 2,
    280,
  );
  ctx.fillStyle = PALETTE.title;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('PRESS R TO TRY AGAIN', VIEW.width / 2, 336);
}
