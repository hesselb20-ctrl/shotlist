import { readFileSync } from 'node:fs';
import type { Caption } from '@shotlist/schema';

function toSeconds(stamp: string): number {
  const parts = stamp.trim().replace(',', '.').split(':').map(Number);
  while (parts.length < 3) parts.unshift(0);
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

/** Reads an SRT or WebVTT file into frame-timed captions. */
export function readSubtitles(file: string, fps: number, durationFrames: number): Caption[] {
  const text = readFileSync(file, 'utf8').replace(/\r/g, '');
  const captions: Caption[] = [];
  for (const block of text.split(/\n{2,}/)) {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    const timing = lines.findIndex((l) => l.includes('-->'));
    if (timing === -1) continue;
    const [from, to] = lines[timing].split('-->').map((s) => s.trim().split(/\s+/)[0]);
    const body = lines.slice(timing + 1).join(' ').replace(/<[^>]+>/g, '').trim();
    if (!body) continue;
    const startFrame = Math.min(durationFrames - 1, Math.max(0, Math.round(toSeconds(from) * fps)));
    const endFrame = Math.min(durationFrames, Math.max(startFrame + 1, Math.round(toSeconds(to) * fps)));
    captions.push({ text: body, startFrame, endFrame, source: 'subtitles' });
  }
  return captions;
}
