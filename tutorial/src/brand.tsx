import React from 'react';
import {OffthreadVideo, staticFile} from 'remotion';
import {shots, total} from './data';
import {roleColor} from './theme';

/** The logo is the sample shot list itself: nine blocks, sized by shot length, coloured by role. */
export const LogoMark: React.FC<{width: number; height: number; reveal?: number}> = ({width, height, reveal = 1}) => (
  <div style={{width, height, position: 'relative'}}>
    {shots.map((shot, i) => {
      const t = Math.min(1, Math.max(0, reveal * shots.length - i));
      return (
        <div
          key={shot.id}
          style={{
            position: 'absolute',
            left: (shot.startFrame / total) * width,
            width: (shot.durationFrames / total) * width - height * 0.14,
            height,
            borderRadius: height * 0.22,
            backgroundColor: roleColor[shot.role],
            transform: `scaleY(${t})`,
            opacity: t,
          }}
        />
      );
    })}
  </div>
);

/** The sample clip, muted. Fills its parent. */
export const Clip: React.FC<{playbackRate?: number}> = ({playbackRate = 1}) => (
  <OffthreadVideo
    src={staticFile('test-clip.mp4')}
    muted
    playbackRate={playbackRate}
    style={{width: '100%', height: '100%', display: 'block'}}
  />
);
