import React from 'react';
import {AbsoluteFill, Freeze, Loop, useCurrentFrame} from 'remotion';
import {Clip, LogoMark} from '../brand';
import {beatOffset, cuts, onsets, shotlist, shots, total} from '../data';
import {BEAT, color, font, lerp, rise, roleColor, size} from '../theme';
import {Appear, ClipFrame, CONTENT_WIDTH, MARGIN, Panel, Scene, Stat, Terminal, TimelineBar, Waveform} from '../ui';

const mono: React.CSSProperties = {fontFamily: font.mono};

/* 1 · Title card */
export const Title: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const exit = lerp(frame, [duration - 8, duration - 1], [1, 0]);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: color.bg,
        color: color.text,
        fontFamily: font.sans,
        padding: `0 ${MARGIN}px`,
        justifyContent: 'center',
        opacity: exit,
      }}
    >
      <LogoMark width={760} height={56} reveal={1} />
      <Appear at={-30}>
        <div style={{fontSize: 210, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1, marginTop: 36}}>shotlist</div>
      </Appear>
      <Appear at={-30}>
        <div style={{fontSize: size.xxl, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 28, lineHeight: 1.15}}>
          Any short video, broken down to the frame.
          <br />
          <span style={{color: color.accent}}>Exported as a Remotion template.</span>
        </div>
      </Appear>
      <Appear at={-30}>
        <div style={{...mono, fontSize: size.md, color: color.muted, marginTop: 48, letterSpacing: '0.02em'}}>
          cuts · beats · hook · captions · pacing
        </div>
      </Appear>
    </AbsoluteFill>
  );
};

/* 2 · The problem */
export const Problem: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const questions = ['Where exactly are the cuts?', 'Which ones land on the beat?', 'How long is the hook?'];
  const barWidth = 760;
  return (
    <Scene index={2} kicker="The problem" title={<>You can feel that an ad works.<br />You can't see why.</>} duration={duration}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div style={{width: 860, paddingTop: 12}}>
          {questions.map((q, i) => (
            <Appear key={q} at={BEAT * (2 + i * 2)} style={{display: 'flex', alignItems: 'center', gap: 24, marginBottom: 34}}>
              <div
                style={{
                  ...mono,
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: color.raised,
                  border: `2px solid ${color.line}`,
                  color: color.coral,
                  fontSize: size.lg,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ?
              </div>
              <div style={{fontSize: size.xl, fontWeight: 600, letterSpacing: '-0.02em'}}>{q}</div>
            </Appear>
          ))}
          <Appear at={BEAT * 9}>
            <div style={{fontSize: size.lg, color: color.muted, marginTop: 28, lineHeight: 1.3, maxWidth: 800}}>
              Scrubbing frame by frame with a notepad
              <br />
              is not a workflow.
            </div>
          </Appear>
        </div>
        <Appear at={-30}>
          <ClipFrame width={barWidth} label="some ad you wish you had made">
            <Loop durationInFrames={total}>
              <Clip />
            </Loop>
          </ClipFrame>
          <div
            style={{
              width: barWidth + 20,
              height: 84,
              marginTop: 22,
              borderRadius: 12,
              border: `3px dashed ${color.line}`,
              position: 'relative',
            }}
          >
            {cuts.map((c, i) => (
              <div
                key={c}
                style={{
                  ...mono,
                  position: 'absolute',
                  left: (c / total) * barWidth,
                  top: 18,
                  fontSize: size.lg,
                  fontWeight: 700,
                  color: color.coral,
                  opacity: rise(frame, BEAT * 3 + i * 5, 6),
                }}
              >
                ?
              </div>
            ))}
          </div>
        </Appear>
      </div>
    </Scene>
  );
};

/* 3 · Input video */
export const Input: React.FC<{duration: number}> = ({duration}) => {
  const s = shotlist.source;
  const steps: [string, string, string][] = [
    ['ffprobe', 'metadata', color.muted],
    ['ffmpeg scene score', 'cuts', color.coral],
    ['audio onsets', 'beat map', color.cyan],
    ['Claude, on sampled frames', 'hook and roles', color.accent],
  ];
  return (
    <Scene index={3} kicker="Input" title="Point it at a video." duration={duration}>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <div style={{width: 980}}>
          <Terminal
            at={BEAT}
            command="shotlist analyze test-clip.mp4"
            lines={[
              {at: BEAT * 4, text: `probe    ${s.width}x${s.height}, ${s.fps} fps, ${s.durationFrames} frames (${s.durationSec}s)`},
              {at: BEAT * 5, text: `cuts     ${cuts.length} cuts, ${shots.length} shots`},
              {at: BEAT * 6, text: `beats    ${onsets.length} onsets, about ${shotlist.beats.bpm} BPM`},
              {at: BEAT * 7, text: `claude   reading ${shots.length} frames with claude-fable-5-2`},
              {at: BEAT * 8, text: 'wrote    shotlist.json', color: color.green},
            ]}
          />
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 32}}>
            {steps.map(([tool, result, tone], i) => (
              <Appear key={tool} at={BEAT * (4 + i)}>
                <div
                  style={{
                    ...mono,
                    fontSize: size.sm,
                    padding: '12px 20px',
                    borderRadius: 12,
                    backgroundColor: color.raised,
                    border: `2px solid ${color.line}`,
                    color: color.muted,
                  }}
                >
                  {tool} <span style={{color: tone}}>→ {result}</span>
                </div>
              </Appear>
            ))}
          </div>
        </div>
        <Appear at={4}>
          <ClipFrame width={676} tag="input" label={`${s.file} · ${s.durationSec}s · ${s.fps} fps`}>
            <Loop durationInFrames={total}>
              <Clip />
            </Loop>
          </ClipFrame>
        </Appear>
      </div>
    </Scene>
  );
};

/* 4 · Timeline of detected cuts */
export const Cuts: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const start = BEAT * 2;
  const rate = total / (duration - start - BEAT);
  const playhead = Math.min(total, Math.max(0, (frame - start) * rate));
  const found = cuts.filter((c) => c <= playhead);
  const current = shots.findLast((s) => s.startFrame <= playhead) ?? shots[0];
  const lastCut = found[found.length - 1];
  const flash = lastCut === undefined ? 0 : lerp(playhead - lastCut, [0, 14], [1, 0]);

  return (
    <Scene index={4} kicker="Cut detection" title="Every cut, to the frame." duration={duration}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <ClipFrame width={640} tag="analysing" label={`frame ${String(Math.floor(playhead)).padStart(3, '0')} / ${total}`}>
          <Freeze frame={Math.min(total - 1, Math.floor(playhead))}>
            <Clip />
          </Freeze>
        </ClipFrame>
        <Panel style={{width: 980, height: 384, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', gap: 72}}>
            <Stat value={String(found.length)} label="cuts found" tone={color.accent} valueSize={size.x5} />
            <Stat value={String(found.length + 1)} label="shots" valueSize={size.x5} />
            <Stat
              value={lastCut === undefined ? 'none' : `${(lastCut / shotlist.source.fps).toFixed(2)}s`}
              label={lastCut === undefined ? 'last cut' : `last cut, frame ${lastCut}`}
              valueSize={size.x5}
            />
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 20, ...mono, fontSize: size.md}}>
            <div
              style={{
                backgroundColor: roleColor[current.role],
                color: color.bg,
                fontWeight: 700,
                padding: '6px 18px',
                borderRadius: 10,
              }}
            >
              {current.id}
            </div>
            <div style={{color: color.muted}}>
              {current.startSec.toFixed(2)}s to {current.endSec.toFixed(2)}s · {current.durationFrames} frames
            </div>
          </div>
        </Panel>
      </div>
      <div style={{marginTop: 56, padding: 6, borderRadius: 18, boxShadow: `0 0 0 4px rgba(243, 239, 230, ${flash * 0.9})`}}>
        <TimelineBar width={CONTENT_WIDTH - 12} height={130} revealed={playhead} playhead={playhead} />
      </div>
    </Scene>
  );
};

/* 5 · Beat map waveform */
export const BeatMap: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const x = (f: number) => (f / total) * CONTENT_WIDTH;
  const onBeat = shots.filter((s) => s.index > 0 && s.cutOnBeat).length;
  const offBeat = cuts.length - onBeat;
  const linesAt = BEAT * 7;
  return (
    <Scene index={5} kicker="Beat map" title="Which cuts land on the beat." duration={duration}>
      <Waveform
        width={CONTENT_WIDTH}
        height={290}
        progress={lerp(frame, [BEAT, BEAT * 4], [0, 1])}
        onsetProgress={lerp(frame, [BEAT * 4, BEAT * 6], [0, 1])}
      />
      <div style={{position: 'relative', height: 78}}>
        {shots.slice(1).map((shot, i) => {
          const tone = shot.cutOnBeat ? color.green : color.coral;
          const t = rise(frame, linesAt + i * 5, 8);
          return (
            <React.Fragment key={shot.id}>
              <div
                style={{
                  position: 'absolute',
                  left: x(shot.startFrame) - 2,
                  top: 0,
                  width: 4,
                  height: 78 * t,
                  backgroundColor: tone,
                  borderRadius: 2,
                }}
              />
              {!shot.cutOnBeat ? (
                <div
                  style={{
                    ...mono,
                    position: 'absolute',
                    left: x(shot.startFrame) + 14,
                    top: 20,
                    fontSize: size.sm,
                    fontWeight: 700,
                    color: tone,
                    opacity: t,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {beatOffset(shot.startFrame)}f off
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
      <TimelineBar width={CONTENT_WIDTH} height={96} labels="id" />
      <div style={{display: 'flex', gap: 96, marginTop: 36}}>
        <Appear at={BEAT * 10}>
          <Stat value={`${Math.round(shotlist.beats.bpm ?? 0)} BPM`} label="tempo estimate" tone={color.cyan} />
        </Appear>
        <Appear at={BEAT * 11}>
          <Stat value={String(onsets.length)} label="audio onsets" tone={color.accent} />
        </Appear>
        <Appear at={BEAT * 12}>
          <Stat value={`${onBeat} of ${cuts.length}`} label="cuts on the beat" tone={color.green} />
        </Appear>
        <Appear at={BEAT * 13}>
          <Stat value={String(offBeat)} label="cuts off the beat" tone={color.coral} />
        </Appear>
      </div>
    </Scene>
  );
};
