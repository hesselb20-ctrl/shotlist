// Cuts a 6-second preview GIF out of media/tutorial.mp4 (the cut-detection scene).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const media = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'media');
const START = 18; // seconds into the tutorial
const LENGTH = 6;

const result = spawnSync(
  'ffmpeg',
  [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-ss', String(START), '-t', String(LENGTH), '-i', path.join(media, 'tutorial.mp4'),
    '-filter_complex',
    'fps=12,scale=880:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=220:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle',
    '-loop', '0', path.join(media, 'preview.gif'),
  ],
  { stdio: 'inherit' },
);
if (result.status !== 0) process.exit(result.status ?? 1);
console.log('wrote media/preview.gif');
