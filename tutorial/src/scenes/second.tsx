import React from 'react';
import {Freeze, Loop, Sequence, useCurrentFrame} from 'remotion';
import {Main as ReskinnedTemplate} from '../../../examples/reskinned-template/src/Main';
import {Main as PlaceholderTemplate} from '../../../examples/test-clip-template/src/Main';
import {Clip} from '../brand';
import {onsets, REPO, shotlist, shots, total} from '../data';
import {BEAT, color, font, size} from '../theme';
import {Appear, ClipFrame, Code, CONTENT_WIDTH, Panel, Scene, Terminal, TimelineBar, type Token} from '../ui';

const mono: React.CSSProperties = {fontFamily: font.mono};
const example = shots[3];

/* 6 · JSON output */
export const Json: React.FC<{duration: number}> = ({duration}) => {
  const p = shotlist.pacing;
  const lines: Token[][] = [
    [['{', 'muted']],
    [['  '], ['"shots"', 'key'], [': [', 'muted']],
    [['    { '], ['"id"', 'key'], [': '], [`"${example.id}"`, 'string'], [','], [' "role"', 'key'], [': '], [`"${example.role}"`, 'string'], [',']],
    [['      '], ['"startFrame"', 'key'], [': '], [String(example.startFrame), 'number'], [', '], ['"endFrame"', 'key'], [': '], [String(example.endFrame), 'number'], [',']],
    [['      '], ['"startSec"', 'key'], [': '], [String(example.startSec), 'number'], [', '], ['"endSec"', 'key'], [': '], [String(example.endSec), 'number'], [',']],
    [['      '], ['"slot"', 'key'], [': { '], ['"type"', 'key'], [': '], [`"${example.slot.type}"`, 'string'], [', '], ['"hint"', 'key'], [': '], ['"…"', 'string'], [' },']],
    [['      '], ['"cutOnBeat"', 'key'], [': '], [String(example.cutOnBeat), 'accent'], [' }'], [`, … ${shots.length - 1} more`, 'muted']],
    [['  ],', 'muted']],
    [['  '], ['"hook"', 'key'], [': { '], ['"startFrame"', 'key'], [': '], ['0', 'number'], [', '], ['"endFrame"', 'key'], [': '], [String(shotlist.hook.endFrame), 'number'], [' },']],
    [['  '], ['"beats"', 'key'], [': { '], ['"bpm"', 'key'], [': '], [String(shotlist.beats.bpm), 'number'], [', '], ['"onsets"', 'key'], [': ['], [`… ${onsets.length}`, 'muted'], ['] },']],
    [['  '], ['"captions"', 'key'], [': ['], [`… ${shotlist.captions.length}`, 'muted'], ['],']],
    [['  '], ['"pacing"', 'key'], [': { '], ['"shotCount"', 'key'], [': '], [String(p.shotCount), 'number'], [', '], ['"avgShotSec"', 'key'], [': '], [String(p.avgShotSec), 'number'], [',']],
    [['              '], ['"cutsOnBeatRatio"', 'key'], [': '], [String(p.cutsOnBeatRatio), 'number'], [' }']],
    [['}', 'muted']],
  ];
  const cards: [string, string, string][] = [
    ['shots', 'Frame range, role and a slot hint for every shot.', color.coral],
    ['hook', 'Where the opening ends and which device it uses.', color.accent],
    ['beats', 'Tempo, every onset and a loudness envelope.', color.cyan],
    ['captions · pacing', 'Caption timing, cut rate and how the pace moves.', color.green],
  ];
  return (
    <Scene index={6} kicker="Output" title="One file: shotlist.json" duration={duration}>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <Panel style={{width: 1010, padding: '32px 40px'}}>
          <Code lines={lines} at={BEAT} stagger={3} highlight={[3, 4]} />
        </Panel>
        <div style={{width: 670, display: 'flex', flexDirection: 'column', gap: 20}}>
          {cards.map(([key, text, tone], i) => (
            <Appear key={key} at={BEAT * (3 + i * 2)}>
              <Panel style={{padding: '22px 28px', borderLeft: `8px solid ${tone}`}}>
                <div style={{...mono, fontSize: size.md, fontWeight: 700, color: tone}}>{key}</div>
                <div style={{fontSize: size.sm, color: color.text, marginTop: 8, lineHeight: 1.3}}>{text}</div>
              </Panel>
            </Appear>
          ))}
        </div>
      </div>
    </Scene>
  );
};

/* 7 · Generated template */
export const Template: React.FC<{duration: number}> = ({duration}) => {
  const seq = (i: number): Token[][] => {
    const s = shots[i];
    return [
      [['<'], ['Sequence', 'tag'], [' from', 'key'], ['={'], [String(s.startFrame), 'number'], ['}'], [' durationInFrames', 'key'], ['={'], [String(s.durationFrames), 'number'], ['}>']],
      [['  <'], ['Slot', 'tag'], [' shot', 'key'], [`={shots[${i}]}`], [' fill', 'key'], [`={slots.${s.id}}`], [' />']],
      [['</'], ['Sequence', 'tag'], ['>']],
    ];
  };
  return (
    <Scene index={7} kicker="Export" title="Get it back as a Remotion template." duration={duration}>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <div style={{width: 960}}>
          <Terminal
            at={BEAT}
            fontSize={size.sm + 2}
            command="shotlist export shotlist.json -o my-ad"
            lines={[{at: BEAT * 4, text: 'wrote    16 files to my-ad', color: color.green}]}
          />
          <Appear at={BEAT * 4}>
            <Panel style={{marginTop: 24, padding: '26px 36px'}}>
              <div style={{...mono, fontSize: size.sm, color: color.muted, marginBottom: 14}}>my-ad/src/Main.tsx</div>
              <Code lines={[...seq(0), ...seq(1), ...seq(2), [[`… ${shots.length - 3} more, one per shot`, 'muted']]]} at={BEAT * 5} stagger={3} highlight={[0, 3, 6]} />
            </Panel>
          </Appear>
        </div>
        <Appear at={BEAT * 5}>
          <ClipFrame width={676} tag="template" label="placeholder slots, source timing">
            <Sequence from={BEAT * 5} layout="none">
              <Loop durationInFrames={total}>
                <PlaceholderTemplate />
              </Loop>
            </Sequence>
          </ClipFrame>
          <div style={{fontSize: size.md, color: color.muted, marginTop: 36, lineHeight: 1.35, width: 700}}>
            Every shot is a <span style={{...mono, color: color.violet}}>&lt;Sequence&gt;</span> with the
            <br />
            start frame and length of the source.
          </div>
        </Appear>
      </div>
    </Scene>
  );
};

/* 8 · Re-skinned result */
export const Reskin: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const playhead = Math.min(total - 1, frame);
  return (
    <Scene index={8} kicker="Re-skin" title="Same edit. Your footage." duration={duration}>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <ClipFrame width={826} tag="source" tagColor={color.muted} label={shotlist.source.file}>
          <Freeze frame={playhead}>
            <Clip />
          </Freeze>
        </ClipFrame>
        <ClipFrame width={826} tag="re-skinned" tagColor={color.green} label={`${shots.length} slots filled, 0 timings changed`}>
          <Freeze frame={playhead}>
            <ReskinnedTemplate />
          </Freeze>
        </ClipFrame>
      </div>
      <div style={{marginTop: 40}}>
        <TimelineBar width={CONTENT_WIDTH} height={72} labels="id" ruler={false} playhead={playhead} />
      </div>
    </Scene>
  );
};

/* 9 · Install */
export const Install: React.FC<{duration: number}> = ({duration}) => {
  return (
    <Scene index={9} kicker="Get it" title="Clone, build, analyse." duration={duration}>
      <Terminal
        at={BEAT}
        style={{width: 1300}}
        command={`git clone https://${REPO}`}
        lines={[
          {at: BEAT * 4, text: '$ cd shotlist && npm install && npm run build', color: color.text},
          {at: BEAT * 6, text: '$ npx shotlist analyze your-video.mp4', color: color.text},
          {at: BEAT * 7, text: '$ npx shotlist export shotlist.json -o my-ad', color: color.text},
        ]}
      />
      <Appear at={BEAT * 8}>
        <div style={{fontSize: size.x3, fontWeight: 800, letterSpacing: '-0.03em', color: color.accent, marginTop: 56}}>{REPO}</div>
        <div style={{...mono, fontSize: size.md, color: color.muted, marginTop: 18}}>MIT · needs Node 22 and ffmpeg</div>
      </Appear>
    </Scene>
  );
};
