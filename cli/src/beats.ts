import type { Beats, Onset, Source } from '@shotlist/schema';
import { run } from './ffmpeg.js';
import { round } from './media.js';

const SAMPLE_RATE = 22050;
const HOP = 256; // 11.6 ms, about a third of a frame at 30 fps
const WINDOW = 1024;

/**
 * Onset detection on the audio track: energy flux on a log-compressed RMS envelope,
 * peak-picked against a moving average. Good at drums, claps, hard edits and beeps;
 * it does not follow soft melodic changes.
 */
export async function detectBeats(file: string, source: Source): Promise<Beats> {
  if (!source.hasAudio) return { bpm: null, onsets: [], envelope: [] };

  const { stdout } = await run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', file, '-vn',
    '-ac', '1', '-ar', String(SAMPLE_RATE), '-f', 'f32le', '-',
  ]);
  const samples = new Float32Array(stdout.buffer, stdout.byteOffset, Math.floor(stdout.byteLength / 4));
  if (samples.length < WINDOW * 2) return { bpm: null, onsets: [], envelope: [] };

  // RMS per hop.
  const hops = Math.floor((samples.length - WINDOW) / HOP) + 1;
  const rms = new Float32Array(hops);
  for (let i = 0; i < hops; i++) {
    let sum = 0;
    const start = i * HOP;
    for (let j = 0; j < WINDOW; j++) sum += samples[start + j] * samples[start + j];
    rms[i] = Math.sqrt(sum / WINDOW);
  }

  // Onset detection function: positive change of log-compressed energy.
  const odf = new Float32Array(hops);
  for (let i = 1; i < hops; i++) {
    odf[i] = Math.max(0, Math.log1p(100 * rms[i]) - Math.log1p(100 * rms[i - 1]));
  }

  const hopSec = HOP / SAMPLE_RATE;
  const meanWin = Math.round(0.4 / hopSec);
  const peakWin = Math.round(0.05 / hopSec);
  const minGap = Math.round(0.09 / hopSec);
  let globalMax = 0;
  for (const v of odf) if (v > globalMax) globalMax = v;
  const floor = globalMax * 0.12;

  const picked: { hop: number; value: number }[] = [];
  for (let i = 1; i < hops - 1; i++) {
    const v = odf[i];
    if (v < floor) continue;
    let isPeak = true;
    for (let j = Math.max(0, i - peakWin); j <= Math.min(hops - 1, i + peakWin); j++) {
      if (odf[j] > v) { isPeak = false; break; }
    }
    if (!isPeak) continue;
    let sum = 0;
    let n = 0;
    for (let j = Math.max(0, i - meanWin); j <= Math.min(hops - 1, i + meanWin); j++) { sum += odf[j]; n++; }
    if (v < (sum / n) * 2.5) continue;
    const last = picked[picked.length - 1];
    if (last && i - last.hop < minGap) {
      if (v > last.value) picked[picked.length - 1] = { hop: i, value: v };
      continue;
    }
    picked.push({ hop: i, value: v });
  }

  const strongest = picked.reduce((m, p) => Math.max(m, p.value), 0) || 1;
  const onsets: Onset[] = [];
  for (const p of picked) {
    // The energy rise is measured at the end of the analysis window; shift back to where the sound starts.
    const timeSec = Math.max(0, (p.hop * HOP + WINDOW - HOP) / SAMPLE_RATE);
    const frame = Math.min(source.durationFrames - 1, Math.round(timeSec * source.fps));
    if (onsets.length && onsets[onsets.length - 1].frame === frame) continue;
    onsets.push({ frame, timeSec: round(timeSec, 3), strength: round(p.value / strongest, 3) });
  }

  return { bpm: estimateBpm(odf, hopSec, onsets.length), onsets, envelope: envelopePerFrame(rms, hopSec, source) };
}

/** Tempo from the autocorrelation of the onset function, searched between 60 and 180 BPM. */
function estimateBpm(odf: Float32Array, hopSec: number, onsetCount: number): number | null {
  if (onsetCount < 4) return null;
  const minLag = Math.round(60 / 180 / hopSec);
  const maxLag = Math.min(Math.round(60 / 60 / hopSec), odf.length - 1);
  let zero = 0;
  for (const v of odf) zero += v * v;
  if (!zero) return null;
  let best = 0;
  let bestLag = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = lag; i < odf.length; i++) sum += odf[i] * odf[i - lag];
    const score = sum / zero;
    if (score > best * 1.02) { best = score; bestLag = lag; }
  }
  if (!bestLag || best < 0.1) return null;
  return round(60 / (bestLag * hopSec), 1);
}

function envelopePerFrame(rms: Float32Array, hopSec: number, source: Source): number[] {
  const values = new Array<number>(source.durationFrames).fill(0);
  let max = 0;
  for (let f = 0; f < source.durationFrames; f++) {
    const from = Math.floor(f / source.fps / hopSec);
    const to = Math.max(from + 1, Math.floor((f + 1) / source.fps / hopSec));
    let peak = 0;
    for (let i = from; i < to && i < rms.length; i++) peak = Math.max(peak, rms[i]);
    values[f] = peak;
    max = Math.max(max, peak);
  }
  return values.map((v) => (max ? round(v / max, 3) : 0));
}
