// Generates samples/test-clip.mp4: 15 seconds of ffmpeg test patterns with a tone and a 120 BPM pulse.
// Everything is synthesised by ffmpeg, so the clip has no third-party content in it.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const SIZE = '1280x720';
const FPS = 30;

// [ffmpeg test source, seconds]. Two cuts (at 3.8s and 6.3s) are deliberately off the beat.
const shots = [
  ['smptehdbars', 1.5],
  ['testsrc2', 1.5],
  ['rgbtestsrc', 0.8],
  ['pal75bars', 1.2],
  ['yuvtestsrc', 1.3],
  ['testsrc', 1.7],
  ['smptebars', 2.0],
  ['pal100bars', 2.0],
  ['gradients=seed=7:speed=0.02', 3.0],
];
const total = shots.reduce((sum, [, d]) => sum + d, 0);

// A soft 220 Hz tone plus a kick and a click every half second (120 BPM).
const m = 'mod(t,0.5)';
const audio =
  `0.7*sin(2*PI*60*${m}+8*(1-exp(-30*${m})))*exp(-9*${m})` +
  `+0.2*sin(2*PI*880*${m})*exp(-40*${m})` +
  `+0.06*sin(2*PI*220*t)`;

const args = ['-y', '-hide_banner', '-loglevel', 'error'];
for (const [src, seconds] of shots) {
  const sep = src.includes('=') ? ':' : '=';
  args.push('-f', 'lavfi', '-t', String(seconds), '-i', `${src}${sep}size=${SIZE}:rate=${FPS}`);
}
args.push('-f', 'lavfi', '-t', String(total), '-i', `aevalsrc=exprs='${audio}':sample_rate=44100`);
args.push(
  '-filter_complex',
  `${shots.map((_, i) => `[${i}:v]`).join('')}concat=n=${shots.length}:v=1:a=0,format=yuv420p[v]`,
  '-map', '[v]', '-map', `${shots.length}:a`,
  '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-t', String(total),
  'samples/test-clip.mp4',
);

mkdirSync('samples', { recursive: true });
const result = spawnSync('ffmpeg', args, { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`wrote samples/test-clip.mp4 (${total}s, ${shots.length} shots)`);
