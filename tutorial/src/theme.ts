import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {Easing, interpolate} from 'remotion';

const inter = loadInter('normal', {weights: ['400', '500', '600', '700', '800'], subsets: ['latin']});
const mono = loadMono('normal', {weights: ['400', '500', '700'], subsets: ['latin']});

/** One palette for the tutorial, the README images and the exported template. */
export const color = {
  bg: '#0D1017',
  panel: '#151A23',
  raised: '#1C2330',
  line: '#2B3442',
  text: '#F3EFE6',
  muted: '#93A0B4',
  accent: '#FFB224',
  coral: '#FF6B5E',
  cyan: '#4CC9F0',
  violet: '#A78BFA',
  green: '#6EE7A0',
};

export const roleColor: Record<string, string> = {
  hook: color.coral,
  setup: color.cyan,
  proof: color.violet,
  payoff: color.green,
  cta: color.accent,
  other: color.muted,
};

export const font = {sans: inter.fontFamily, mono: mono.fontFamily};

/** Type scale, ratio 1.25. Nothing in the video is set smaller than `sm`. */
export const size = {xs: 20, sm: 25, md: 31, lg: 39, xl: 49, xxl: 61, x3: 76, x4: 95, x5: 119};

export const FPS = 30;
/** The bed track runs at 120 BPM: one beat is 15 frames. Scene lengths and reveals sit on this grid. */
export const BEAT = 15;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/** 0 to 1 starting at `at`, eased out. */
export const rise = (frame: number, at: number, length = 14): number =>
  interpolate(frame, [at, at + length], [0, 1], {...clamp, easing: easeOut});

export const lerp = (frame: number, range: [number, number], output: [number, number]): number =>
  interpolate(frame, range, output, clamp);
