import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SCHEMA_VERSION, validateShotlist } from '@shotlist/schema';
import type { Caption, Pacing, Shot, Shotlist, Source } from '@shotlist/schema';
import { detectBeats } from './beats.js';
import { readSubtitles } from './captions.js';
import { averageColor, detectCuts, grabJpeg, probe, round } from './media.js';
import {
  DEFAULT_MODEL,
  heuristicStructure,
  readStructureWithClaude,
  type SampledFrame,
  type ShotTiming,
  type Structure,
} from './structure.js';

export const VERSION = '0.1.0';
const BEAT_TOLERANCE_FRAMES = 2;
const MAX_FRAMES_FOR_MODEL = 60;

export interface AnalyzeOptions {
  threshold: number;
  minShotFrames: number;
  llm: boolean;
  model?: string;
  captions?: string;
  framesDir?: string;
  log?: (message: string) => void;
}

export async function analyze(file: string, options: AnalyzeOptions): Promise<Shotlist> {
  const log = options.log ?? (() => {});

  const source = await probe(file);
  log(`probe    ${source.width}x${source.height}, ${source.fps} fps, ${source.durationFrames} frames (${source.durationSec}s)`);

  const [cuts, beats] = await Promise.all([
    detectCuts(file, source, options.threshold, options.minShotFrames),
    detectBeats(file, source),
  ]);
  log(`cuts     ${cuts.length} cuts, ${cuts.length + 1} shots`);
  log(`beats    ${beats.onsets.length} onsets${beats.bpm ? `, about ${beats.bpm} BPM` : ''}`);

  const onsetFrames = beats.onsets.map((o) => o.frame);
  const bounds = [0, ...cuts, source.durationFrames];
  const timings: ShotTiming[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const startFrame = bounds[i];
    const endFrame = bounds[i + 1];
    timings.push({
      index: i,
      startFrame,
      endFrame,
      startSec: round(startFrame / source.fps, 3),
      endSec: round(endFrame / source.fps, 3),
      cutOnBeat: i > 0 && onsetFrames.some((f) => Math.abs(f - startFrame) <= BEAT_TOLERANCE_FRAMES),
    });
  }
  const pacing = measurePacing(source, timings);

  // One frame from the middle of every shot: used for the average colour and, when enabled, for Claude.
  const midTime = (t: ShotTiming) => (t.startFrame + Math.floor((t.endFrame - t.startFrame) / 2)) / source.fps;
  const colors = await mapLimit(timings, 4, (t) => averageColor(file, midTime(t)));

  let structure: Structure | null = null;
  if (options.llm) {
    const step = Math.max(1, Math.ceil(timings.length / MAX_FRAMES_FOR_MODEL));
    const chosen = timings.filter((t) => t.index % step === 0);
    if (step > 1) {
      log(`frames   ${timings.length} shots is more than ${MAX_FRAMES_FOR_MODEL}; sampling a frame from every ${step}th shot`);
    }
    const frames: SampledFrame[] = await mapLimit(chosen, 4, async (t) => ({
      shotIndex: t.index,
      timeSec: midTime(t),
      jpeg: await grabJpeg(file, midTime(t)),
    }));
    if (options.framesDir) {
      mkdirSync(options.framesDir, { recursive: true });
      for (const f of frames) {
        writeFileSync(path.join(options.framesDir, `s${String(f.shotIndex + 1).padStart(2, '0')}.jpg`), f.jpeg);
      }
    }
    const model = options.model ?? DEFAULT_MODEL;
    log(`claude   reading ${frames.length} frames with ${model}`);
    structure = await readStructureWithClaude(source, timings, pacing, beats.bpm, frames, model);
  } else {
    log('claude   skipped (--no-llm): roles and labels are guessed from shot position');
  }
  structure ??= heuristicStructure(source, timings, pacing, beats.bpm);

  const shots: Shot[] = timings.map((t, i) => {
    const read = structure.shots[i];
    return {
      id: `s${String(i + 1).padStart(2, '0')}`,
      index: i,
      startFrame: t.startFrame,
      endFrame: t.endFrame,
      durationFrames: t.endFrame - t.startFrame,
      startSec: t.startSec,
      endSec: t.endSec,
      role: read.role,
      label: read.label,
      description: read.description,
      slot: { type: read.slotType, hint: read.slotHint },
      cutOnBeat: t.cutOnBeat,
      dominantColor: colors[i],
    };
  });

  let captions: Caption[] = [];
  if (options.captions) {
    captions = readSubtitles(options.captions, source.fps, source.durationFrames);
    log(`captions ${captions.length} from ${path.basename(options.captions)}`);
  } else {
    captions = shots
      .map((s, i) => ({ shot: s, text: structure.shots[i].onScreenText.trim() }))
      .filter((c) => c.text !== '')
      .map((c) => ({ text: c.text, startFrame: c.shot.startFrame, endFrame: c.shot.endFrame, source: 'vision' as const }));
    if (captions.length) log(`captions ${captions.length} read from frames (timed to their shot)`);
  }

  const shotlist: Shotlist = {
    version: SCHEMA_VERSION,
    generator: { name: 'shotlist', version: VERSION },
    source,
    detection: {
      sceneThreshold: options.threshold,
      minShotFrames: options.minShotFrames,
      beatToleranceFrames: BEAT_TOLERANCE_FRAMES,
    },
    shots,
    hook: {
      startFrame: 0,
      endFrame: shots[structure.hook.endShotIndex].endFrame,
      type: structure.hook.type,
      description: structure.hook.description,
    },
    beats,
    captions,
    pacing,
    analysis: structure.analysis,
  };

  const problems = validateShotlist(shotlist);
  if (problems.length) throw new Error(`Internal error: the result does not match the schema:\n  ${problems.join('\n  ')}`);
  return shotlist;
}

function measurePacing(source: Source, shots: ShotTiming[]): Pacing {
  const lengths = shots.map((s) => (s.endFrame - s.startFrame) / source.fps);
  const sorted = [...lengths].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const cuts = shots.length - 1;

  let curve: Pacing['curve'] = 'steady';
  if (shots.length >= 4) {
    const half = Math.floor(lengths.length / 2);
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const ratio = avg(lengths.slice(lengths.length - half)) / avg(lengths.slice(0, half));
    if (ratio < 0.8) curve = 'accelerating';
    else if (ratio > 1.25) curve = 'decelerating';
  }

  return {
    shotCount: shots.length,
    avgShotSec: round(source.durationSec / shots.length, 2),
    medianShotSec: round(median, 2),
    minShotSec: round(sorted[0], 2),
    maxShotSec: round(sorted[sorted.length - 1], 2),
    cutsPerMinute: round((cuts / source.durationSec) * 60, 1),
    cutsOnBeatRatio: cuts ? round(shots.filter((s) => s.cutOnBeat).length / cuts, 2) : 0,
    curve,
  };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}
