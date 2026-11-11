import React from 'react';
import {Composition} from 'remotion';
import {shotlist} from './data';
import {Main} from './Main';

export const Root: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={Main}
      durationInFrames={shotlist.source.durationFrames}
      fps={shotlist.source.fps}
      width={shotlist.source.width}
      height={shotlist.source.height}
    />
  );
};
