import React from 'react';
import {AbsoluteFill, Freeze, useCurrentFrame} from 'remotion';
import {Main as ReskinnedTemplate} from '../../examples/reskinned-template/src/Main';
import {Clip, LogoMark} from './brand';
import {beatOffset, cuts, onsets, shotlist, shots, total} from './data';
import {color, font, roleColor} from './theme';
import {ClipFrame, Panel, TimelineBar, Waveform} from './ui';

// README images. They are 1600 px wide and shown at roughly half that on GitHub,
// so the smallest text here is 28 px (about 14.5 px on the page).
const SMALL = 28;
const mono: React.CSSProperties = {fontFamily: font.mono};
const base: React.CSSProperties = {backgroundColor: color.bg, color: color.text, fontFamily: font.sans};

const onBeat = shots.filter((s) => s.index > 0 && s.cutOnBeat).length;
const bpm = Math.round(shotlist.beats.bpm ?? 0);

/* hero.png · 1600 x 640 */
export const Hero: React.FC = () => (
  <AbsoluteFill style={{...base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 80px'}}>
    <div style={{width: 820, whiteSpace: 'nowrap'}}>
      <LogoMark width={420} height={36} />
      <div style={{fontSize: 168, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1, marginTop: 24}}>shotlist</div>
      <div style={{fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: 26}}>
        Any short video, broken down to the frame.
        <br />
        <span style={{color: color.accent}}>Exported as a Remotion template.</span>
      </div>
      <div
        style={{
          ...mono,
          display: 'inline-block',
          fontSize: 30,
          marginTop: 40,
          padding: '14px 24px',
          borderRadius: 14,
          backgroundColor: color.panel,
          border: `2px solid ${color.line}`,
        }}
      >
        <span style={{color: color.accent}}>$ </span>shotlist analyze ad.mp4
      </div>
    </div>
    <Panel style={{width: 600, padding: 30}}>
      <div style={{...mono, fontSize: SMALL, color: color.muted, marginBottom: 14}}>beats</div>
      <Waveform width={540} height={140} />
      <div style={{...mono, fontSize: SMALL, color: color.muted, margin: '22px 0 14px'}}>shots</div>
      <TimelineBar width={540} height={84} labels="none" ruler={false} />
      <div style={{...mono, fontSize: SMALL, marginTop: 26, color: color.text}}>
        {shots.length} shots · {bpm} BPM · <span style={{color: color.green}}>{onBeat}/{cuts.length} on beat</span>
      </div>
    </Panel>
  </AbsoluteFill>
);

/* timeline.png · 1600 x 800 */
export const TimelineStill: React.FC = () => {
  const width = 1440;
  const x = (f: number) => (f / total) * width;
  const offBeat = shots.filter((s) => s.index > 0 && !s.cutOnBeat);
  const last = shots[shots.length - 1];
  const callouts: {left: number; tone: string; text: string}[] = [
    {left: 0, tone: roleColor.hook, text: `Hook: first ${shots[0].endSec.toFixed(2)}s`},
    {
      left: x(offBeat[0]?.startFrame ?? 0) - 40,
      tone: color.coral,
      text: `${offBeat.length} cuts miss the beat by ${beatOffset(offBeat[0]?.startFrame ?? 0)} frames`,
    },
    {left: x(last.startFrame), tone: roleColor[last.role], text: `End card: ${(last.endSec - last.startSec).toFixed(2)}s`},
  ];
  return (
    <AbsoluteFill style={{...base, padding: '56px 80px'}}>
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
        <div style={{fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em'}}>{shotlist.source.file}</div>
        <div style={{...mono, fontSize: SMALL, color: color.muted}}>
          {shots.length} shots · {shotlist.source.durationSec.toFixed(1)}s · {shotlist.source.fps} fps · {bpm} BPM
        </div>
      </div>

      <div style={{...mono, fontSize: SMALL, color: color.muted, margin: '34px 0 10px'}}>
        loudness, with <span style={{color: color.accent}}>{onsets.length} detected onsets</span>
      </div>
      <Waveform width={width} height={150} />

      <div style={{position: 'relative', height: 72}}>
        {shots.slice(1).map((shot) => {
          const tone = shot.cutOnBeat ? color.green : color.coral;
          return (
            <React.Fragment key={shot.id}>
              <div style={{position: 'absolute', left: x(shot.startFrame) - 2, top: 0, width: 4, height: 72, backgroundColor: tone, borderRadius: 2}} />
              {!shot.cutOnBeat ? (
                <div style={{...mono, position: 'absolute', left: x(shot.startFrame) + 12, top: 16, fontSize: SMALL, fontWeight: 700, color: tone, whiteSpace: 'nowrap'}}>
                  {beatOffset(shot.startFrame)}f off
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
      <TimelineBar width={width} height={124} fontSize={SMALL} />

      <div style={{position: 'relative', height: 84, marginTop: 4}}>
        {callouts.map((c) => (
          <div key={c.text} style={{position: 'absolute', left: c.left, top: 0, borderLeft: `4px solid ${c.tone}`, paddingLeft: 14, paddingTop: 20, height: 62}}>
            <div style={{fontSize: SMALL, fontWeight: 600, whiteSpace: 'nowrap'}}>{c.text}</div>
          </div>
        ))}
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: 30, marginTop: 22, ...mono, fontSize: SMALL}}>
        {['hook', 'setup', 'proof', 'payoff', 'cta'].map((role) => (
          <div key={role} style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <div style={{width: 26, height: 26, borderRadius: 7, backgroundColor: roleColor[role]}} />
            <span style={{color: color.muted}}>{role}</span>
          </div>
        ))}
        <div style={{display: 'flex', alignItems: 'center', gap: 10, marginLeft: 28}}>
          <div style={{width: 5, height: 28, borderRadius: 2, backgroundColor: color.green}} />
          <span style={{color: color.muted}}>cut on the beat</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <div style={{width: 5, height: 28, borderRadius: 2, backgroundColor: color.coral}} />
          <span style={{color: color.muted}}>off the beat</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* before-after.png · 1600 x 800, rendered at one frame of the clip */
export const BeforeAfter: React.FC = () => {
  const frame = useCurrentFrame();
  const shot = shots.findLast((s) => s.startFrame <= frame) ?? shots[0];
  return (
    <AbsoluteFill style={{...base, padding: '48px 56px'}}>
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 30}}>
        <div style={{fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em'}}>Same edit, your footage</div>
        <div style={{...mono, fontSize: SMALL, color: color.muted}}>
          frame {frame} · {shot.id} · {(frame / shotlist.source.fps).toFixed(2)}s
        </div>
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <ClipFrame width={704} tag="source" tagColor={color.muted} label={shotlist.source.file} fontSize={SMALL}>
          <Freeze frame={frame}>
            <Clip />
          </Freeze>
        </ClipFrame>
        <ClipFrame width={704} tag="re-skinned" tagColor={color.green} label="same 9 sequences" fontSize={SMALL}>
          <Freeze frame={frame}>
            <ReskinnedTemplate />
          </Freeze>
        </ClipFrame>
      </div>
      <div style={{marginTop: 34}}>
        <TimelineBar width={1488} height={84} labels="id" fontSize={SMALL} playhead={frame} />
      </div>
    </AbsoluteFill>
  );
};
