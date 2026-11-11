import type React from 'react';

export type ShotRole = 'hook' | 'setup' | 'proof' | 'payoff' | 'cta' | 'other';

export interface Shot {
  id: string;
  index: number;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  startSec: number;
  endSec: number;
  role: ShotRole;
  label: string;
  description: string;
  slot: {type: 'video' | 'image' | 'text'; hint: string};
  cutOnBeat: boolean;
  dominantColor: string;
}

export interface Caption {
  text: string;
  startFrame: number;
  endFrame: number;
  source: 'subtitles' | 'vision';
}

export interface Shotlist {
  source: {file: string; durationSec: number; durationFrames: number; fps: number; width: number; height: number};
  shots: Shot[];
  hook: {startFrame: number; endFrame: number; type: string; description: string};
  beats: {bpm: number | null; onsets: {frame: number; timeSec: number; strength: number}[]; envelope: number[]};
  captions: Caption[];
}

export type SlotFill =
  | {kind: 'placeholder'}
  | {kind: 'video'; src: string; startFrom?: number; muted?: boolean}
  | {kind: 'image'; src: string}
  | {kind: 'text'; text: string; background?: string; color?: string}
  | {kind: 'component'; component: React.FC<{shot: Shot}>};
