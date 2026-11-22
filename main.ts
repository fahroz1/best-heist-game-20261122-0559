// Midnight Vault — the hand-in program (Node 22, standard library only).
// The game is this directory's game/ folder, plain static files a desktop
// browser loads offline (game/index.html and its ES modules, no library and
// no network request). This program copies game/ and screenshots/ from
// beside this file to the output directory and writes /output/dossier.json,
// the summary the judge reads, with the vendored make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Resolve everything relative to this file, never to the working directory:
// the grader runs the program from a container whose cwd is not the repo.
const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function countFiles(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const child = join(dir, entry.name);
    total += entry.isDirectory() ? 1 + countFiles(child) : 1;
  }
  return total;
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoRoot, 'game'), join(outDir, 'game'));

const shotsDir = join(repoRoot, 'screenshots');
if (existsSync(shotsDir)) {
  copyTree(shotsDir, join(outDir, 'screenshots'));
} else {
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
}

// Refuse to hand in an entry the gate would refuse on its file counts,
// instead of silently writing a dossier for it.
const gameEntries = countFiles(join(outDir, 'game'));
if (gameEntries > 993) throw new Error(`game/ holds ${gameEntries} entries, over the 993 cap`);
const shotFiles = readdirSync(join(outDir, 'screenshots')).filter((name) => {
  const stats = statSync(join(outDir, 'screenshots', name));
  return stats.isFile() && !name.startsWith('.');
});
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`screenshots/ holds ${shotFiles.length} images, need 3 or 4`);
}
for (const name of shotFiles) {
  if (!/^[A-Za-z0-9._-]+$/.test(name) || name.startsWith('.') || name.startsWith('-')) {
    throw new Error(`screenshot name ${name} is not a plain file name`);
  }
  const bytes = statSync(join(outDir, 'screenshots', name)).size;
  if (bytes > 262144) throw new Error(`screenshot ${name} is ${bytes} bytes, over 256 KiB`);
}

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Midnight Vault handed in: ${gameEntries} game entries, ${shotFiles.length} screenshots -> ${outDir}`);
