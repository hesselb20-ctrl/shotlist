import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {onsets, shotlist, shots, total} from './data';
import {color, font, lerp, rise, roleColor, size} from './theme';

export const SCENE_COUNT = 9;
export const MARGIN = 96;
export const CONTENT_WIDTH = 1920 - MARGIN * 2;

/** Fades and lifts its children in at frame `at` of the current sequence. */
export const Appear: React.FC<{at: number; y?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
  at,
  y = 28,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const t = rise(frame, at);
  return <div style={{opacity: t, transform: `translateY(${(1 - t) * y}px)`, ...style}}>{children}</div>;
};

/** Frame of every tutorial scene: step counter, title, body, chapter bar. */
export const Scene: React.FC<{
  index: number;
  kicker: string;
  title: React.ReactNode;
  duration: number;
  children: React.ReactNode;
}> = ({index, kicker, title, duration, children}) => {
  const frame = useCurrentFrame();
  const exit = lerp(frame, [duration - 8, duration - 1], [1, 0]);
  return (
    <AbsoluteFill style={{backgroundColor: color.bg, color: color.text, fontFamily: font.sans}}>
      <AbsoluteFill style={{padding: `72px ${MARGIN}px 0`, opacity: exit}}>
        <Appear at={0} y={16}>
          <div
            style={{
              fontFamily: font.mono,
              fontSize: size.sm,
              fontWeight: 700,
              color: color.accent,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {String(index).padStart(2, '0')} / {kicker}
          </div>
        </Appear>
        <Appear at={3}>
          <div style={{fontSize: size.xxl, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, marginTop: 14}}>
            {title}
          </div>
        </Appear>
        <div style={{position: 'relative', flex: 1, marginTop: 44}}>{children}</div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: MARGIN, bottom: 36, width: CONTENT_WIDTH, display: 'flex', gap: 8}}>
        {Array.from({length: SCENE_COUNT}, (_, i) => (
          <div key={i} style={{flex: 1, height: 6, borderRadius: 3, backgroundColor: color.line, overflow: 'hidden'}}>
            <div
              style={{
                height: '100%',
                width: i + 1 < index ? '100%' : i + 1 === index ? `${(frame / duration) * 100}%` : 0,
                backgroundColor: i + 1 === index ? color.accent : color.muted,
              }}
            />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Panel: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => (
  <div
    style={{
      backgroundColor: color.panel,
      border: `2px solid ${color.line}`,
      borderRadius: 20,
      padding: 32,
      ...style,
    }}
  >
    {children}
  </div>
);

export interface TerminalLine {
  at: number;
  text: string;
  color?: string;
}

/** A terminal that types `command` from frame `at`, then prints `lines` at their own frames. */
export const Terminal: React.FC<{
  at: number;
  command: string;
  lines: TerminalLine[];
  fontSize?: number;
  style?: React.CSSProperties;
}> = ({at, command, lines, fontSize = size.md, style}) => {
  const frame = useCurrentFrame();
  const typed = Math.max(0, Math.floor((frame - at) * 1.6));
  const done = typed >= command.length;
  const cursor = Math.floor(frame / 8) % 2 === 0;
  return (
    <Panel style={{padding: 0, overflow: 'hidden', ...style}}>
      <div style={{display: 'flex', gap: 10, padding: '18px 24px', borderBottom: `2px solid ${color.line}`}}>
        {[color.coral, color.accent, color.green].map((c) => (
          <div key={c} style={{width: 16, height: 16, borderRadius: 8, backgroundColor: c, opacity: 0.85}} />
        ))}
      </div>
      <div style={{padding: '26px 32px 32px', fontFamily: font.mono, fontSize, lineHeight: 1.55}}>
        <div style={{whiteSpace: 'pre'}}>
          <span style={{color: color.accent}}>$ </span>
          <span>{command.slice(0, typed)}</span>
          {!done || lines.every((l) => frame < l.at) ? <span style={{opacity: cursor ? 1 : 0}}>▍</span> : null}
        </div>
        {lines.map((line) => (
          <div key={line.text} style={{whiteSpace: 'pre', color: line.color ?? color.muted, opacity: frame >= line.at ? 1 : 0}}>
            {line.text}
          </div>
        ))}
      </div>
    </Panel>
  );
};

/** Scales a 1280x720 composition (the clip or an exported template) to `width`. */
export const Embedded: React.FC<{width: number; children: React.ReactNode}> = ({width, children}) => {
  const w = shotlist.source.width;
  const h = shotlist.source.height;
  const scale = width / w;
  return (
    <div style={{width, height: h * scale, position: 'relative', overflow: 'hidden', borderRadius: 14}}>
      <div style={{width: w, height: h, position: 'absolute', transform: `scale(${scale})`, transformOrigin: 'top left'}}>
        {children}
      </div>
    </div>
  );
};

export const ClipFrame: React.FC<{
  width: number;
  label: string;
  tag?: string;
  tagColor?: string;
  fontSize?: number;
  children: React.ReactNode;
}> = ({width, label, tag, tagColor = color.accent, fontSize = size.sm, children}) => (
  <div style={{width: width + 24}}>
    <div style={{padding: 10, backgroundColor: color.panel, border: `2px solid ${color.line}`, borderRadius: 22}}>
      <Embedded width={width}>{children}</Embedded>
    </div>
    <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, fontFamily: font.mono, fontSize}}>
      {tag ? (
        <span style={{backgroundColor: tagColor, color: color.bg, fontWeight: 700, padding: '4px 14px', borderRadius: 8}}>{tag}</span>
      ) : null}
      <span style={{color: color.muted}}>{label}</span>
    </div>
  </div>
);

/**
 * The shot list as a bar. `revealed` is a source frame: shots are drawn only up to it,
 * which makes the bar fill in as a playhead crosses each cut.
 */
export const TimelineBar: React.FC<{
  width: number;
  height?: number;
  revealed?: number;
  playhead?: number | null;
  labels?: 'full' | 'id' | 'none';
  ruler?: boolean;
  fontSize?: number;
}> = ({width, height = 120, revealed = total, playhead = null, labels = 'full', ruler = true, fontSize = size.sm}) => {
  const x = (f: number) => (f / total) * width;
  const seconds = Math.floor(shotlist.source.durationSec);
  return (
    <div style={{width, position: 'relative'}}>
      <div style={{height, position: 'relative', backgroundColor: color.panel, borderRadius: 12}}>
        {shots.map((shot) => {
          const visible = Math.max(0, Math.min(shot.durationFrames, revealed - shot.startFrame));
          if (visible <= 0) return null;
          const w = x(visible) - 4;
          const wide = x(shot.durationFrames) > 215;
          return (
            <div
              key={shot.id}
              style={{
                position: 'absolute',
                left: x(shot.startFrame) + 2,
                width: Math.max(2, w),
                height,
                borderRadius: 10,
                backgroundColor: roleColor[shot.role],
                color: color.bg,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                paddingLeft: wide ? 14 : 9,
                fontFamily: font.mono,
                whiteSpace: 'nowrap',
              }}
            >
              {labels !== 'none' ? <div style={{fontSize: fontSize * 1.15, fontWeight: 700}}>{shot.id}</div> : null}
              {labels === 'full' ? (
                <div style={{fontSize, fontWeight: 500, opacity: 0.8}}>{wide ? `${shot.role} · ${shot.durationFrames}f` : `${shot.durationFrames}f`}</div>
              ) : null}
            </div>
          );
        })}
      </div>
      {ruler ? (
        <div style={{position: 'relative', height: fontSize * 1.9, marginTop: 8}}>
          {Array.from({length: seconds + 1}, (_, s) => (
            <div
              key={s}
              style={{
                position: 'absolute',
                left: x(s * shotlist.source.fps),
                transform: s === seconds ? 'translateX(-100%)' : s === 0 ? undefined : 'translateX(-50%)',
                fontFamily: font.mono,
                fontSize: fontSize * 0.9,
                color: color.muted,
              }}
            >
              {s}s
            </div>
          ))}
        </div>
      ) : null}
      {playhead !== null ? (
        <div
          style={{
            position: 'absolute',
            left: x(Math.min(total, Math.max(0, playhead))) - 2,
            top: -12,
            width: 4,
            height: height + 24,
            borderRadius: 2,
            backgroundColor: color.text,
            boxShadow: `0 0 0 3px ${color.bg}`,
          }}
        />
      ) : null}
    </div>
  );
};

/** Loudness envelope of the clip, one bar per video frame, with detected onsets marked on top. */
export const Waveform: React.FC<{
  width: number;
  height: number;
  progress?: number;
  onsetProgress?: number;
}> = ({width, height, progress = 1, onsetProgress = 1}) => {
  const step = width / total;
  const env = shotlist.beats.envelope;
  const shown = Math.round(progress * total);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display: 'block'}}>
      <line x1={0} x2={width} y1={height / 2} y2={height / 2} stroke={color.line} strokeWidth={2} />
      {env.slice(0, shown).map((v, i) => {
        const h = Math.max(3, v * (height - 44));
        return (
          <rect key={i} x={i * step} y={(height - h) / 2} width={Math.max(1.5, step - 1.2)} height={h} rx={1} fill={color.cyan} opacity={0.85} />
        );
      })}
      {onsets.map((f, i) =>
        i / onsets.length < onsetProgress ? (
          <g key={f}>
            <line x1={f * step} x2={f * step} y1={10} y2={height - 10} stroke={color.accent} strokeWidth={3} opacity={0.9} />
            <circle cx={f * step} cy={10} r={7} fill={color.accent} />
          </g>
        ) : null,
      )}
    </svg>
  );
};

export type Token = [text: string, tone?: 'key' | 'string' | 'number' | 'muted' | 'accent' | 'tag'];

const tokenColor: Record<string, string> = {
  key: color.cyan,
  string: color.green,
  number: color.accent,
  muted: color.muted,
  accent: color.coral,
  tag: color.violet,
};

/** Hand-tokenised code block. Lines appear one after another from frame `at`. */
export const Code: React.FC<{lines: Token[][]; at?: number; stagger?: number; fontSize?: number; highlight?: number[]}> = ({
  lines,
  at = 0,
  stagger = 2,
  fontSize = size.sm,
  highlight = [],
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{fontFamily: font.mono, fontSize, lineHeight: 1.5}}>
      {lines.map((tokens, i) => (
        <div
          key={i}
          style={{
            whiteSpace: 'pre',
            opacity: rise(frame, at + i * stagger, 8),
            backgroundColor: highlight.includes(i) ? 'rgba(255, 178, 36, 0.13)' : undefined,
            margin: '0 -16px',
            padding: '0 16px',
            borderRadius: 6,
          }}
        >
          {tokens.length === 0 ? ' ' : tokens.map(([text, tone], j) => (
            <span key={j} style={{color: tone ? tokenColor[tone] : color.text}}>{text}</span>
          ))}
        </div>
      ))}
    </div>
  );
};

/** A big number with a label under it. */
export const Stat: React.FC<{value: string; label: string; tone?: string; valueSize?: number}> = ({
  value,
  label,
  tone = color.text,
  valueSize = size.x3,
}) => (
  <div>
    <div style={{fontSize: valueSize, fontWeight: 800, letterSpacing: '-0.03em', color: tone, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>
      {value}
    </div>
    <div style={{fontSize: size.sm, color: color.muted, marginTop: 10}}>{label}</div>
  </div>
);
