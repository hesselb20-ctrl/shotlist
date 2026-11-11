import React from 'react';
import {Audio, Composition, Series, staticFile} from 'remotion';
import {total} from './data';
import {BeatMap, Cuts, Input, Problem, Title} from './scenes/first';
import {Install, Json, Reskin, Template} from './scenes/second';
import {BeforeAfter, Hero, TimelineStill} from './stills';
import {BEAT, FPS} from './theme';

// Scene lengths in beats (15 frames each), so every scene change lands on the bed track's kick.
const scenes: [React.FC<{duration: number}>, number][] = [
  [Title, 8],
  [Problem, 14],
  [Input, 12],
  [Cuts, 20],
  [BeatMap, 18],
  [Json, 14],
  [Template, 18],
  [Reskin, 32],
  [Install, 12],
];
const TUTORIAL_FRAMES = scenes.reduce((sum, [, beats]) => sum + beats * BEAT, 0);

const Tutorial: React.FC = () => (
  <>
    <Series>
      {scenes.map(([Component, beats], i) => (
        <Series.Sequence key={i} durationInFrames={beats * BEAT}>
          <Component duration={beats * BEAT} />
        </Series.Sequence>
      ))}
    </Series>
    <Audio src={staticFile('bed.m4a')} volume={0.55} />
  </>
);

export const Root: React.FC = () => (
  <>
    <Composition id="Tutorial" component={Tutorial} durationInFrames={TUTORIAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="Hero" component={Hero} durationInFrames={1} fps={FPS} width={1600} height={640} />
    <Composition id="Timeline" component={TimelineStill} durationInFrames={1} fps={FPS} width={1600} height={800} />
    <Composition id="BeforeAfter" component={BeforeAfter} durationInFrames={total} fps={FPS} width={1600} height={800} />
  </>
);
