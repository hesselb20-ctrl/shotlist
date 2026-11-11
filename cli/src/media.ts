import path from 'node:path';
import type { Source } from '@shotlist/schema';
import { run } from './ffmpeg.js';

function parseRate(rate: string | undefined): number {
  if (!rate) return 0;
  const [n, d] = rate.split('/').map(Number);
  return d ? n / d : n;
}

/** Reads container and stream metadata with ffprobe. */
export async function probe(file: string): Promise<Source> {
  const { stdout } = await run('ffprobe', [
    '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file,
  ]);
  const info = JSON.parse(stdout.toString());
  const video = (info.streams ?? []).find((s: any) => s.codec_type === 'video');
  const audio = (info.streams ?? []).find((s: any) => s.codec_type === 'audio');
  if (!video) throw new Error(`No video stream found in ${file}`);

  const fps = parseRate(video.avg_frame_rate) || parseRate(video.r_frame_rate);
  if (!fps) throw new Error('Could not read the frame rate of the video stream');
  const durationSec = Number(video.duration ?? info.format?.duration);
  if (!Number.isFinite(durationSec) || durationSec <= 0) throw new Error('Could not read the duration of the video');
  const counted = Number(video.nb_frames);
  const durationFrames = Number.isFinite(counted) && counted > 0 ? counted : Math.round(durationSec * fps);

  return {
    file: path.basename(file),
    durationSec: round(durationFrames / fps, 4),
    durationFrames,
    fps: round(fps, 4),
    width: video.width,
    height: video.height,
    hasAudio: Boolean(audio),
    videoCodec: video.codec_name ?? null,
    audioCodec: audio?.codec_name ?? null,
  };
}

/**
 * Finds cuts with ffmpeg's scene score. Returns the first frame of every new shot
 * (never frame 0), sorted, with cuts closer than minShotFrames merged.
 */
export async function detectCuts(
  file: string,
  source: Source,
  threshold: number,
  minShotFrames: number,
): Promise<number[]> {
  const { stderr } = await run('ffmpeg', [
    '-hide_banner', '-nostats', '-i', file, '-an',
    '-vf', `select='gt(scene,${threshold})',showinfo`,
    '-f', 'null', '-',
  ]);
  const cuts: number[] = [];
  for (const m of stderr.matchAll(/pts_time:\s*([0-9.]+)/g)) {
    const frame = Math.round(Number(m[1]) * source.fps);
    const prev = cuts.length ? cuts[cuts.length - 1] : 0;
    if (frame - prev < minShotFrames) continue;
    if (source.durationFrames - frame < minShotFrames) continue;
    cuts.push(frame);
  }
  return cuts;
}

/** Grabs one frame as a JPEG, scaled so its longest side is at most maxSide. */
export async function grabJpeg(file: string, timeSec: number, maxSide = 768): Promise<Buffer> {
  const { stdout } = await run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-ss', timeSec.toFixed(4), '-i', file,
    '-frames:v', '1',
    '-vf', `scale='if(gt(iw,ih),min(${maxSide},iw),-2)':'if(gt(iw,ih),-2,min(${maxSide},ih))'`,
    '-f', 'image2pipe', '-c:v', 'mjpeg', '-q:v', '4', '-',
  ]);
  return stdout;
}

/** Average colour of one frame as "#rrggbb". */
export async function averageColor(file: string, timeSec: number): Promise<string> {
  const { stdout } = await run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-ss', timeSec.toFixed(4), '-i', file,
    '-frames:v', '1', '-vf', 'scale=1:1:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-',
  ]);
  if (stdout.length < 3) return '#808080';
  return '#' + [stdout[0], stdout[1], stdout[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
