import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';

export const SCHEMA_VERSION = '1.0';

export type ShotRole = 'hook' | 'setup' | 'proof' | 'payoff' | 'cta' | 'other';
export type SlotType = 'video' | 'image' | 'text';

export interface Source {
  file: string;
  durationSec: number;
  durationFrames: number;
  fps: number;
  width: number;
  height: number;
  hasAudio: boolean;
  videoCodec: string | null;
  audioCodec: string | null;
}

export interface Shot {
  /** Stable id, "s01", "s02", ... */
  id: string;
  /** Zero-based position in the edit. */
  index: number;
  /** First frame of the shot (inclusive). */
  startFrame: number;
  /** Frame after the last frame of the shot (exclusive). */
  endFrame: number;
  durationFrames: number;
  startSec: number;
  endSec: number;
  role: ShotRole;
  label: string;
  description: string;
  /** What kind of asset should replace this shot in the template. */
  slot: { type: SlotType; hint: string };
  /** True when the cut into this shot lands on a detected audio onset. */
  cutOnBeat: boolean;
  /** Average colour of the sampled frame, "#rrggbb". */
  dominantColor: string;
}

export interface Hook {
  startFrame: number;
  endFrame: number;
  type: string;
  description: string;
}

export interface Onset {
  frame: number;
  timeSec: number;
  /** 0..1, relative to the strongest onset in the file. */
  strength: number;
}

export interface Beats {
  /** Tempo estimate, null when no stable pulse was found. */
  bpm: number | null;
  onsets: Onset[];
  /** Loudness envelope, one value (0..1) per video frame. */
  envelope: number[];
}

export interface Caption {
  text: string;
  startFrame: number;
  endFrame: number;
  /** "subtitles": timed from an SRT/VTT file. "vision": on-screen text read from a sampled frame, timed to its shot. */
  source: 'subtitles' | 'vision';
}

export interface Pacing {
  shotCount: number;
  avgShotSec: number;
  medianShotSec: number;
  minShotSec: number;
  maxShotSec: number;
  cutsPerMinute: number;
  /** Share of cuts (0..1) that land on an audio onset. */
  cutsOnBeatRatio: number;
  curve: 'accelerating' | 'steady' | 'decelerating';
}

export interface Analysis {
  /** "claude": structure read from sampled frames. "heuristic": position-based guess, no model call. */
  source: 'claude' | 'heuristic';
  model: string | null;
  summary: string;
  whyItWorks: string[];
}

export interface Shotlist {
  version: string;
  generator: { name: string; version: string };
  source: Source;
  detection: { sceneThreshold: number; minShotFrames: number; beatToleranceFrames: number };
  shots: Shot[];
  hook: Hook;
  beats: Beats;
  captions: Caption[];
  pacing: Pacing;
  analysis: Analysis;
}

export const schemaPath = fileURLToPath(new URL('../shotlist.schema.json', import.meta.url));

let compiled: any = null;

/**
 * Validates against the JSON Schema plus the timing rules the schema cannot express
 * (contiguous shots that cover the whole source). Returns a list of problems, empty when valid.
 */
export function validateShotlist(data: unknown): string[] {
  if (!compiled) {
    const ajv = new Ajv2020({ allErrors: true });
    compiled = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf8')));
  }
  if (!compiled(data)) {
    return (compiled.errors ?? []).map((e: any) => `${e.instancePath || '/'} ${e.message}`);
  }
  const s = data as Shotlist;
  const problems: string[] = [];
  let cursor = 0;
  s.shots.forEach((shot, i) => {
    if (shot.index !== i) problems.push(`shots[${i}].index should be ${i}`);
    if (shot.startFrame !== cursor) {
      problems.push(`shots[${i}] starts at frame ${shot.startFrame}, expected ${cursor} (shots must be contiguous)`);
    }
    if (shot.durationFrames !== shot.endFrame - shot.startFrame) {
      problems.push(`shots[${i}].durationFrames does not match its frame range`);
    }
    cursor = shot.endFrame;
  });
  if (cursor !== s.source.durationFrames) {
    problems.push(`shots end at frame ${cursor}, but the source has ${s.source.durationFrames} frames`);
  }
  return problems;
}
