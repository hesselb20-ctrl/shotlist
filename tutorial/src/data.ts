import json from '../../samples/test-clip.shotlist.json';

/** The real analysis of samples/test-clip.mp4. Every number on screen comes from this file. */
export const shotlist = json;
export const shots = json.shots;
export const total = json.source.durationFrames;
export const onsets = json.beats.onsets.map((o) => o.frame);
export const cuts = shots.slice(1).map((s) => s.startFrame);

/** Distance in frames from a cut to the nearest audio onset. */
export const beatOffset = (frame: number): number => Math.min(...onsets.map((o) => Math.abs(o - frame)));

export const REPO = 'github.com/hesselb20-ctrl/shotlist';
