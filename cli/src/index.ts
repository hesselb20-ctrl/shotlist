#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import { validateShotlist, type Shotlist } from '@shotlist/schema';
import { exportTemplate } from '@shotlist/template';
import { analyze, VERSION } from './analyze.js';
import { DEFAULT_MODEL } from './structure.js';

const program = new Command();

program
  .name('shotlist')
  .description('Break a short video down into a frame-accurate shot list and export it as a Remotion template.')
  .version(VERSION);

program
  .command('analyze')
  .description('Detect cuts, beats, hook and pacing of a video and write shotlist.json')
  .argument('<video>', 'video file (anything ffmpeg can read)')
  .option('-o, --out <file>', 'where to write the result', 'shotlist.json')
  .option('-t, --threshold <score>', 'scene score (0-1) that counts as a cut; lower finds more cuts', '0.3')
  .option('--min-shot <frames>', 'shortest shot to keep, in frames', '6')
  .option('--captions <file>', 'SRT or VTT file to take caption timing from')
  .option('--model <id>', 'Claude model for the structure analysis', DEFAULT_MODEL)
  .option('--no-llm', 'skip Claude; guess roles from shot position (timings are unaffected)')
  .option('--frames-dir <dir>', 'also save the frames that were sent to Claude')
  .action(async (video: string, opts) => {
    if (!existsSync(video)) fail(`File not found: ${video}`);
    const threshold = Number(opts.threshold);
    const minShotFrames = Number(opts.minShot);
    if (!(threshold > 0 && threshold < 1)) fail('--threshold must be between 0 and 1');
    if (!(Number.isInteger(minShotFrames) && minShotFrames >= 1)) fail('--min-shot must be a whole number of frames');

    let llm: boolean = opts.llm;
    if (llm && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_PROFILE) {
      console.error('note     no Claude credentials found (ANTHROPIC_API_KEY); continuing as if --no-llm was passed');
      llm = false;
    }

    const shotlist = await analyze(video, {
      threshold,
      minShotFrames,
      llm,
      model: opts.model,
      captions: opts.captions,
      framesDir: opts.framesDir,
      log: (m) => console.error(m),
    });
    writeFileSync(opts.out, JSON.stringify(shotlist, null, 2) + '\n');
    console.error(`wrote    ${opts.out}`);
    printTable(shotlist);
  });

program
  .command('export')
  .description('Generate a Remotion project from shotlist.json: one <Sequence> per shot, with slots to fill')
  .argument('<shotlist>', 'shotlist.json written by analyze')
  .option('-o, --out <dir>', 'directory to create', 'shotlist-template')
  .option('--name <name>', 'package name of the generated project')
  .option('--force', 'write into a directory that already has files')
  .action((file: string, opts) => {
    if (!existsSync(file)) fail(`File not found: ${file}`);
    let data: unknown;
    try {
      data = JSON.parse(readFileSync(file, 'utf8'));
    } catch (e) {
      fail(`${file} is not valid JSON: ${(e as Error).message}`);
    }
    const problems = validateShotlist(data);
    if (problems.length) fail(`${file} is not a valid shotlist:\n  ${problems.join('\n  ')}`);
    const written = exportTemplate(data as Shotlist, opts.out, { name: opts.name, force: Boolean(opts.force) });
    console.error(`wrote    ${written.length} files to ${opts.out}`);
    console.error(`next     cd ${path.relative(process.cwd(), path.resolve(opts.out)) || '.'} && npm install && npm run dev`);
  });

program
  .command('validate')
  .description('Check a shotlist.json against the schema')
  .argument('<shotlist>')
  .action((file: string) => {
    if (!existsSync(file)) fail(`File not found: ${file}`);
    const problems = validateShotlist(JSON.parse(readFileSync(file, 'utf8')));
    if (problems.length) fail(`${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
    console.log('valid');
  });

function printTable(s: Shotlist): void {
  const rows = s.shots.map((shot) =>
    [
      shot.id,
      `${shot.startSec.toFixed(2)}-${shot.endSec.toFixed(2)}s`,
      `${shot.durationFrames}f`,
      shot.role,
      shot.index === 0 ? '' : shot.cutOnBeat ? 'on beat' : 'off beat',
    ],
  );
  const widths = [0, 1, 2, 3, 4].map((c) => Math.max(...rows.map((r) => r[c].length)));
  console.log('');
  for (const r of rows) console.log('  ' + r.map((cell, c) => cell.padEnd(widths[c])).join('  ').trimEnd());
  console.log('');
  console.log(
    `  ${s.pacing.shotCount} shots, avg ${s.pacing.avgShotSec}s, ${Math.round(s.pacing.cutsOnBeatRatio * 100)}% of cuts on the beat` +
      `${s.beats.bpm ? `, ~${s.beats.bpm} BPM` : ''}, structure by ${s.analysis.source}`,
  );
}

function fail(message: string): never {
  console.error(`error    ${message}`);
  process.exit(1);
}

program.parseAsync().catch((e: Error) => fail(e.message));
