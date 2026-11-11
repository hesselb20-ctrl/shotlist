// Prepares tutorial/public: a copy of the sample clip and a synthesised 120 BPM bed track.
// Both are generated, so neither is committed.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, '..', 'public');
const clip = path.join(here, '..', '..', 'samples', 'test-clip.mp4');
mkdirSync(pub, { recursive: true });

if (!existsSync(clip)) {
  console.error('samples/test-clip.mp4 is missing. Run `npm run sample:clip` in the repo root first.');
  process.exit(1);
}
copyFileSync(clip, path.join(pub, 'test-clip.mp4'));

const SECONDS = 74;
const bed = path.join(pub, 'bed.m4a');
if (!existsSync(bed)) {
  // Kick on every beat (15 frames at 30 fps), a quiet open fifth underneath.
  const m = 'mod(t,0.5)';
  const expr =
    `0.55*sin(2*PI*58*${m}+8*(1-exp(-30*${m})))*exp(-9*${m})` +
    `+0.05*sin(2*PI*110*t)+0.04*sin(2*PI*165*t)+0.03*sin(2*PI*220*t)*(0.5+0.5*sin(2*PI*0.25*t))`;
  const result = spawnSync(
    'ffmpeg',
    [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'lavfi', '-t', String(SECONDS), '-i', `aevalsrc=exprs='${expr}':sample_rate=44100`,
      '-af', `afade=t=in:d=1,afade=t=out:st=${SECONDS - 2}:d=2`,
      '-c:a', 'aac', '-b:a', '128k', bed,
    ],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('tutorial/public is ready');
