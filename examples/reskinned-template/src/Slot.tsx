import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {shotlist} from './data';
import {roleColor, theme} from './theme';
import type {Shot, SlotFill} from './types';

const resolve = (src: string) => (/^https?:\/\//.test(src) ? src : staticFile(src));

/** One unit is 1/720 of the short side, so the cards read the same in 16:9 and 9:16. */
const unit = Math.min(shotlist.source.width, shotlist.source.height) / 720;
const onsetFrames = shotlist.beats.onsets.map((o) => o.frame);

export const Slot: React.FC<{shot: Shot; fill?: SlotFill}> = ({shot, fill = {kind: 'placeholder'}}) => {
  switch (fill.kind) {
    case 'video':
      return (
        <AbsoluteFill style={{backgroundColor: '#000'}}>
          <OffthreadVideo
            src={resolve(fill.src)}
            startFrom={fill.startFrom ?? 0}
            muted={fill.muted ?? true}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        </AbsoluteFill>
      );
    case 'image':
      return (
        <AbsoluteFill style={{backgroundColor: '#000'}}>
          <Img src={resolve(fill.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      );
    case 'text':
      return (
        <AbsoluteFill
          style={{
            backgroundColor: fill.background ?? theme.bg,
            color: fill.color ?? theme.text,
            fontFamily: theme.fontFamily,
            fontSize: 76 * unit,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            padding: 72 * unit,
            justifyContent: 'center',
            textAlign: 'center',
            whiteSpace: 'pre-line',
          }}
        >
          {fill.text}
        </AbsoluteFill>
      );
    case 'component': {
      const Component = fill.component;
      return <Component shot={shot} />;
    }
    default:
      return <Placeholder shot={shot} />;
  }
};

const Placeholder: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const absolute = shot.startFrame + frame;
  const color = roleColor[shot.role];
  const progress = (frame + 1) / shot.durationFrames;

  // Flash on every audio onset of the source, so you can see the cut land on the beat.
  const sinceOnset = Math.min(...onsetFrames.map((f) => (absolute >= f ? absolute - f : Infinity)));
  const pulse = interpolate(sinceOnset, [0, 6], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        backgroundImage: `linear-gradient(135deg, ${shot.dominantColor}55 0%, ${theme.bg} 70%)`,
        color: theme.text,
        fontFamily: theme.fontFamily,
        padding: 48 * unit,
        justifyContent: 'space-between',
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div
          style={{
            fontFamily: theme.monoFamily,
            fontSize: 28 * unit,
            fontWeight: 700,
            color: theme.bg,
            backgroundColor: color,
            padding: `${8 * unit}px ${18 * unit}px`,
            borderRadius: 8 * unit,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {shot.id} · {shot.role}
        </div>
        <div
          style={{
            width: 28 * unit,
            height: 28 * unit,
            borderRadius: '50%',
            backgroundColor: theme.accent,
            opacity: 0.15 + 0.85 * pulse,
            transform: `scale(${1 + 0.5 * pulse})`,
          }}
        />
      </div>

      <div>
        <div style={{fontSize: 84 * unit, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1}}>{shot.label}</div>
        <div style={{fontSize: 30 * unit, color: theme.muted, marginTop: 20 * unit, maxWidth: 900 * unit, lineHeight: 1.3}}>
          {shot.slot.hint}
        </div>
      </div>

      <div>
        <div style={{fontFamily: theme.monoFamily, fontSize: 26 * unit, color: theme.muted, marginBottom: 14 * unit}}>
          {shot.startSec.toFixed(2)}s to {shot.endSec.toFixed(2)}s · {shot.durationFrames} frames · wants {shot.slot.type}
        </div>
        <div style={{height: 8 * unit, backgroundColor: theme.line, borderRadius: 4 * unit}}>
          <div style={{height: '100%', width: `${progress * 100}%`, backgroundColor: color, borderRadius: 4 * unit}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
