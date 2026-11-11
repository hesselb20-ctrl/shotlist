import {BigWord, EndCard, Fades, Fresh, Hook, Hours, Months, Roast, Ship} from './scenes';
import type {SlotFill} from './types';

/**
 * The exported template with every slot filled. This is the only file that was edited after
 * `shotlist export` (scenes.tsx was added next to it); Main.tsx and its timings are untouched.
 *
 * These slots use {kind: 'component'} so the example needs no media files. With your own footage
 * you would write {kind: 'video', src: 'clip.mp4'} or {kind: 'image', src: 'photo.jpg'} instead.
 */
export const slots: Record<string, SlotFill> = {
  // s01 · hook · 45 frames (1.50s)
  s01: {kind: 'component', component: Hook},
  // s02 · setup · 45 frames (1.50s)
  s02: {kind: 'component', component: Months},
  // s03 · setup · 24 frames (0.80s)
  s03: {kind: 'component', component: BigWord},
  // s04 · setup · 36 frames (1.20s)
  s04: {kind: 'component', component: Fades},
  // s05 · proof · 39 frames (1.30s)
  s05: {kind: 'component', component: Roast},
  // s06 · proof · 51 frames (1.70s)
  s06: {kind: 'component', component: Ship},
  // s07 · proof · 60 frames (2.00s)
  s07: {kind: 'component', component: Hours},
  // s08 · payoff · 60 frames (2.00s)
  s08: {kind: 'component', component: Fresh},
  // s09 · cta · 90 frames (3.00s)
  s09: {kind: 'component', component: EndCard},
};

/** Music or voice-over: a file in public/ or a URL. The source ran at about 120 BPM. */
export const audio: string | null = null;
