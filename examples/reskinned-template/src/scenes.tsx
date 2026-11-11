import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import type {Shot} from './types';

// A re-skin made entirely in code for a made-up coffee brand, so the repo ships no third-party footage.
// Each component fills one slot of the exported template. None of them knows when it plays:
// the timing comes from the <Sequence> in Main.tsx.

const cream = '#F4EDE1';
const espresso = '#2A1B14';
const orange = '#E8622C';
const green = '#1F4D3A';
const sans = 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';

const out = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const enter = (frame: number, at = 0, length = 10) => interpolate(frame, [at, at + length], [0, 1], {...clamp, easing: out});

type Scene = React.FC<{shot: Shot}>;

const Card: React.FC<{bg: string; color: string; children: React.ReactNode; align?: 'center' | 'flex-start'}> = ({
  bg,
  color,
  children,
  align = 'flex-start',
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: bg,
      color,
      fontFamily: sans,
      fontWeight: 800,
      letterSpacing: '-0.035em',
      lineHeight: 0.98,
      padding: 72,
      justifyContent: 'center',
      alignItems: align,
      textAlign: align === 'center' ? 'center' : 'left',
    }}
  >
    {children}
  </AbsoluteFill>
);

const Line: React.FC<{at?: number; size: number; color?: string; children: React.ReactNode}> = ({at = 0, size, color, children}) => {
  const frame = useCurrentFrame();
  const t = enter(frame, at);
  return (
    <div style={{fontSize: size, color, opacity: t, transform: `translateY(${(1 - t) * 40}px)`}}>{children}</div>
  );
};

export const Hook: Scene = () => (
  <Card bg={orange} color={cream}>
    <Line size={150}>Your coffee</Line>
    <Line size={150} at={8} color={espresso}>is stale.</Line>
  </Card>
);

export const Months: Scene = () => {
  const frame = useCurrentFrame();
  return (
    <Card bg={cream} color={espresso}>
      <Line size={84}>Supermarket beans were roasted</Line>
      <div style={{display: 'flex', gap: 18, marginTop: 44}}>
        {Array.from({length: 8}, (_, i) => {
          const t = enter(frame, 8 + i * 3, 6);
          return (
            <div
              key={i}
              style={{
                width: 112,
                height: 112,
                borderRadius: 20,
                backgroundColor: i < 6 ? espresso : 'transparent',
                border: `6px solid ${espresso}`,
                opacity: t,
                transform: `scale(${0.6 + 0.4 * t})`,
              }}
            />
          );
        })}
      </div>
    </Card>
  );
};

export const BigWord: Scene = () => (
  <Card bg={espresso} color={orange} align="center">
    <Line size={230} at={0}>6 months ago.</Line>
  </Card>
);

export const Fades: Scene = () => {
  const frame = useCurrentFrame();
  const width = interpolate(frame, [4, 32], [100, 14], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return (
    <Card bg={cream} color={espresso}>
      <Line size={110}>Flavour fades</Line>
      <Line size={110} at={6} color={orange}>in weeks.</Line>
      <div style={{height: 36, width: '100%', marginTop: 52, backgroundColor: '#E2D6C3', borderRadius: 18}}>
        <div style={{height: '100%', width: `${width}%`, backgroundColor: orange, borderRadius: 18}} />
      </div>
    </Card>
  );
};

const Day: React.FC<{day: string; text: string; bg: string; color: string; accent: string}> = ({day, text, bg, color, accent}) => {
  const frame = useCurrentFrame();
  const t = enter(frame, 0, 12);
  return (
    <Card bg={bg} color={color}>
      <div
        style={{
          fontSize: 44,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: bg,
          backgroundColor: accent,
          padding: '12px 28px',
          borderRadius: 14,
          marginBottom: 36,
          transform: `translateX(${(1 - t) * -80}px)`,
          opacity: t,
        }}
      >
        {day}
      </div>
      <Line size={140} at={5}>{text}</Line>
    </Card>
  );
};

export const Roast: Scene = () => <Day day="Monday" text="We roast." bg={green} color={cream} accent={orange} />;
export const Ship: Scene = () => <Day day="Tuesday" text="We ship." bg={cream} color={green} accent={green} />;

export const Hours: Scene = () => {
  const frame = useCurrentFrame();
  const hours = Math.round(interpolate(frame, [0, 34], [0, 48], {...clamp, easing: out}));
  return (
    <Card bg={espresso} color={cream} align="center">
      <div style={{fontSize: 330, color: orange, fontVariantNumeric: 'tabular-nums'}}>{hours}h</div>
      <Line size={72} at={10}>from roaster to your door</Line>
    </Card>
  );
};

export const Fresh: Scene = () => {
  const frame = useCurrentFrame();
  // One word per beat: the source runs at 120 BPM, 15 frames per beat at 30 fps.
  const words = ['Fresh.', 'Every.', 'Time.'];
  return (
    <Card bg={orange} color={espresso} align="center">
      <div style={{display: 'flex', gap: 36}}>
        {words.map((word, i) => {
          const t = enter(frame, i * 15, 8);
          return (
            <div key={word} style={{fontSize: 150, color: i === 2 ? cream : espresso, opacity: t, transform: `scale(${1.25 - 0.25 * t})`}}>
              {word}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const EndCard: Scene = () => {
  const frame = useCurrentFrame();
  const ring = enter(frame, 0, 20);
  return (
    <Card bg={cream} color={espresso} align="center">
      <div
        style={{
          width: 150,
          height: 150,
          borderRadius: '50%',
          border: `18px solid ${orange}`,
          marginBottom: 36,
          transform: `scale(${ring})`,
        }}
      />
      <Line size={150} at={6}>NORTH ROAST</Line>
      <Line size={56} at={16} color={green}>First bag free. Roasted this week.</Line>
    </Card>
  );
};
