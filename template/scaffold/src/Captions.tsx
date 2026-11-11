import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {shotlist} from './data';
import {theme} from './theme';

const unit = Math.min(shotlist.source.width, shotlist.source.height) / 720;

/** Shows the captions of the source at their original timing. Edit the text in src/shotlist.json. */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const active = shotlist.captions.find((c) => frame >= c.startFrame && frame < c.endFrame);
  if (!active) return null;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', padding: 64 * unit}}>
      <div
        style={{
          fontFamily: theme.fontFamily,
          fontSize: 40 * unit,
          fontWeight: 700,
          color: theme.text,
          backgroundColor: 'rgba(13, 16, 23, 0.82)',
          padding: `${12 * unit}px ${24 * unit}px`,
          borderRadius: 10 * unit,
          textAlign: 'center',
          maxWidth: '86%',
        }}
      >
        {active.text}
      </div>
    </AbsoluteFill>
  );
};
