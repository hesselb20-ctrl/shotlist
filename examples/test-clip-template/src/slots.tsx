import type {SlotFill} from './types';

/**
 * Fill the slots. Each key is one shot of the source edit; when it plays is fixed in Main.tsx.
 *
 *   {kind: 'placeholder'}                                   labelled card (the default)
 *   {kind: 'video', src: 'clip.mp4', startFrom: 0}          file in public/ or a URL; startFrom is in frames
 *   {kind: 'image', src: 'photo.jpg'}                       file in public/ or a URL
 *   {kind: 'text', text: 'Your line', background: '#101010', color: '#ffffff'}
 *   {kind: 'component', component: MyScene}                 any React component, receives {shot}
 */
export const slots: Record<string, SlotFill> = {
  // s01 · hook · 45 frames (1.50s) · wants video
  // Your strongest visual or claim. It has to earn the next shot.
  s01: {kind: 'placeholder'},
  // s02 · setup · 45 frames (1.50s) · wants video
  // Context: the problem, the setting or the before state.
  s02: {kind: 'placeholder'},
  // s03 · setup · 24 frames (0.80s) · wants video
  // Context: the problem, the setting or the before state.
  s03: {kind: 'placeholder'},
  // s04 · setup · 36 frames (1.20s) · wants video
  // Context: the problem, the setting or the before state.
  s04: {kind: 'placeholder'},
  // s05 · proof · 39 frames (1.30s) · wants video
  // Evidence: a demo, a detail or a close-up that backs the claim.
  s05: {kind: 'placeholder'},
  // s06 · proof · 51 frames (1.70s) · wants video
  // Evidence: a demo, a detail or a close-up that backs the claim.
  s06: {kind: 'placeholder'},
  // s07 · proof · 60 frames (2.00s) · wants video
  // Evidence: a demo, a detail or a close-up that backs the claim.
  s07: {kind: 'placeholder'},
  // s08 · payoff · 60 frames (2.00s) · wants video
  // The result or reveal the edit has been building to.
  s08: {kind: 'placeholder'},
  // s09 · cta · 90 frames (3.00s) · wants text
  // End card: product, name and the one thing you want the viewer to do.
  s09: {kind: 'placeholder'},
};

/** Music or voice-over: a file in public/ or a URL. The source ran at about 120.2 BPM, so a track at that tempo keeps the cuts on the beat. */
export const audio: string | null = null;
