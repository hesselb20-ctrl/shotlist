import Anthropic from '@anthropic-ai/sdk';
import type { Analysis, Pacing, ShotRole, SlotType, Source } from '@shotlist/schema';

export const DEFAULT_MODEL = 'claude-fable-5-2';

export interface ShotTiming {
  index: number;
  startFrame: number;
  endFrame: number;
  startSec: number;
  endSec: number;
  cutOnBeat: boolean;
}

export interface ShotRead {
  role: ShotRole;
  label: string;
  description: string;
  slotType: SlotType;
  slotHint: string;
  /** Text visible in the sampled frame, empty when there is none. */
  onScreenText: string;
}

export interface Structure {
  analysis: Analysis;
  hook: { type: string; description: string; endShotIndex: number };
  shots: ShotRead[];
}

export interface SampledFrame {
  shotIndex: number;
  timeSec: number;
  jpeg: Buffer;
}

const ROLES: ShotRole[] = ['hook', 'setup', 'proof', 'payoff', 'cta', 'other'];

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'whyItWorks', 'hook', 'shots'],
  properties: {
    summary: { type: 'string' },
    whyItWorks: { type: 'array', items: { type: 'string' } },
    hook: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'description', 'endShotIndex'],
      properties: {
        type: { type: 'string' },
        description: { type: 'string' },
        endShotIndex: { type: 'integer' },
      },
    },
    shots: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['index', 'role', 'label', 'description', 'slotType', 'slotHint', 'onScreenText'],
        properties: {
          index: { type: 'integer' },
          role: { type: 'string', enum: ROLES },
          label: { type: 'string' },
          description: { type: 'string' },
          slotType: { type: 'string', enum: ['video', 'image', 'text'] },
          slotHint: { type: 'string' },
          onScreenText: { type: 'string' },
        },
      },
    },
  },
} as const;

const SYSTEM = `You analyse short-form videos (ads, TikToks, trailers) for editors who want to reuse the structure of a video with their own footage.

You receive the measured edit of one video: every shot with its frame range, whether the cut into it lands on an audio onset, the pacing numbers, and one frame sampled from the middle of each shot. The timings are measured and are not yours to change. Your job is the part that needs eyes: what each shot is doing in the edit and why the whole thing holds attention.

For every shot give:
- role: hook (earns the first seconds), setup (context or problem), proof (demonstration, evidence, detail), payoff (the result or reveal), cta (the ask or end card), other.
- label: two to four words an editor would write on a shot list.
- description: one sentence on what is on screen and what it does for the viewer.
- slotType and slotHint: what someone re-skinning this edit should drop into the slot (video, image or text), described generically so it applies to their product, not this one.
- onScreenText: any caption or title readable in the frame, verbatim. Empty string when there is none.

For the hook, name the device (for example: question, result first, pattern interrupt, bold claim) and give the index of the last shot that still belongs to it.

summary is two sentences. whyItWorks is three to five specific observations that tie structure to the measured numbers (hook length, cut rate, cuts on the beat, where the pace changes). You only see one frame per shot, so describe motion and sound only when the numbers support it, and say less rather than guess.`;

/** Reads hook, roles and labels from sampled frames with Claude. */
export async function readStructureWithClaude(
  source: Source,
  shots: ShotTiming[],
  pacing: Pacing,
  bpm: number | null,
  frames: SampledFrame[],
  model: string,
): Promise<Structure> {
  const client = new Anthropic();

  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    {
      type: 'text',
      text: [
        `Video: ${source.file}, ${source.durationSec}s, ${source.width}x${source.height}, ${source.fps} fps, ${source.hasAudio ? 'with audio' : 'silent'}.`,
        `Pacing: ${pacing.shotCount} shots, average ${pacing.avgShotSec}s, shortest ${pacing.minShotSec}s, longest ${pacing.maxShotSec}s, ${pacing.cutsPerMinute} cuts per minute, pace is ${pacing.curve}.`,
        `Audio: ${bpm ? `about ${bpm} BPM` : 'no stable tempo found'}, ${Math.round(pacing.cutsOnBeatRatio * 100)}% of cuts land on an onset.`,
        frames.length < shots.length
          ? `Only ${frames.length} of ${shots.length} shots have a sampled frame. Shots without one are listed with timing only.`
          : '',
      ].filter(Boolean).join('\n'),
    },
  ];
  const byShot = new Map(frames.map((f) => [f.shotIndex, f]));
  for (const shot of shots) {
    const frame = byShot.get(shot.index);
    content.push({
      type: 'text',
      text: `Shot ${shot.index}: frames ${shot.startFrame}-${shot.endFrame} (${shot.startSec}s-${shot.endSec}s)${
        shot.index > 0 ? `, cut ${shot.cutOnBeat ? 'on' : 'off'} the beat` : ''
      }${frame ? `, frame at ${frame.timeSec.toFixed(2)}s:` : ', no frame sampled.'}`,
    });
    if (frame) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: frame.jpeg.toString('base64') },
      });
    }
  }
  content.push({ type: 'text', text: `Return one entry in "shots" for each of the ${shots.length} shots, in order.` });

  // Claude Fable 5.2 can decline a request (stop_reason "refusal"); the server-side
  // fallback re-runs it on another model inside the same call.
  const response = await client.beta.messages.create({
    model,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    messages: [{ role: 'user', content }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('The model declined to analyse these frames.');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('The structure analysis was cut off before it finished (max_tokens).');
  }
  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('The model returned no text.');
  const parsed = JSON.parse(text.text) as {
    summary: string;
    whyItWorks: string[];
    hook: { type: string; description: string; endShotIndex: number };
    shots: (ShotRead & { index: number })[];
  };

  const read = new Map(parsed.shots.map((s) => [s.index, s]));
  const fallback = heuristicStructure(source, shots, pacing, bpm);
  return {
    analysis: { source: 'claude', model: response.model, summary: parsed.summary, whyItWorks: parsed.whyItWorks },
    hook: {
      type: parsed.hook.type,
      description: parsed.hook.description,
      endShotIndex: Math.min(shots.length - 1, Math.max(0, parsed.hook.endShotIndex)),
    },
    shots: shots.map((s) => {
      const r = read.get(s.index);
      if (!r) return fallback.shots[s.index];
      return {
        role: ROLES.includes(r.role) ? r.role : 'other',
        label: r.label,
        description: r.description,
        slotType: r.slotType,
        slotHint: r.slotHint,
        onScreenText: r.onScreenText ?? '',
      };
    }),
  };
}

const HEURISTIC_HINT: Record<ShotRole, string> = {
  hook: 'Your strongest visual or claim. It has to earn the next shot.',
  setup: 'Context: the problem, the setting or the before state.',
  proof: 'Evidence: a demo, a detail or a close-up that backs the claim.',
  payoff: 'The result or reveal the edit has been building to.',
  cta: 'End card: product, name and the one thing you want the viewer to do.',
  other: 'Supporting shot.',
};

/**
 * No model call: roles are guessed from where a shot sits in the edit.
 * The timings are still measured; only the labels are generic.
 */
export function heuristicStructure(source: Source, shots: ShotTiming[], pacing: Pacing, bpm: number | null): Structure {
  const total = source.durationFrames;
  const last = shots.length - 1;
  // Without eyes on the frames, the only safe claim is that the opening shot is the hook.
  const hookEnd = 0;

  const read: ShotRead[] = shots.map((s) => {
    const mid = (s.startFrame + s.endFrame) / 2 / total;
    let role: ShotRole;
    if (s.index <= hookEnd) role = 'hook';
    else if (s.index === last && shots.length > 2) role = 'cta';
    else if (mid < 0.35) role = 'setup';
    else if (mid < 0.7) role = 'proof';
    else role = 'payoff';
    return {
      role,
      label: `${role[0].toUpperCase()}${role.slice(1)} shot`,
      description: `Shot ${s.index + 1} of ${shots.length}, ${(s.endSec - s.startSec).toFixed(2)}s. Role guessed from its position in the edit.`,
      slotType: role === 'cta' ? 'text' : 'video',
      slotHint: HEURISTIC_HINT[role],
      onScreenText: '',
    };
  });

  const hookSec = shots[hookEnd].endSec;
  const why: string[] = [
    `The opening shot hands over after ${hookSec.toFixed(2)}s, so the viewer gets a second image inside the first three seconds.`,
    `${pacing.shotCount} shots in ${source.durationSec.toFixed(1)}s is ${pacing.cutsPerMinute} cuts per minute, with shots between ${pacing.minShotSec}s and ${pacing.maxShotSec}s.`,
  ];
  if (source.hasAudio && shots.length > 1) {
    why.push(
      `${Math.round(pacing.cutsOnBeatRatio * 100)}% of cuts land on an audio onset${bpm ? ` (about ${bpm} BPM)` : ''}, which is what makes an edit feel tight.`,
    );
  }
  if (pacing.curve !== 'steady') {
    why.push(
      pacing.curve === 'accelerating'
        ? 'Shots get shorter in the second half, building pace into the end card.'
        : 'Shots get longer in the second half, giving the payoff and end card room to land.',
    );
  }

  return {
    analysis: {
      source: 'heuristic',
      model: null,
      summary: `${pacing.shotCount} shots over ${source.durationSec.toFixed(1)}s, pace ${pacing.curve}. Timings are measured; roles and labels are guessed from position because no model was used.`,
      whyItWorks: why,
    },
    hook: {
      type: 'opening shot',
      description: `First ${hookSec.toFixed(2)}s. Run analyze with a Claude API key to have the hook device named from the frames.`,
      endShotIndex: hookEnd,
    },
    shots: read,
  };
}
