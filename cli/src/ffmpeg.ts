import { spawn } from 'node:child_process';

export interface RunResult {
  stdout: Buffer;
  stderr: string;
}

/** Runs ffmpeg/ffprobe without a shell, so file names and filter strings need no quoting. */
export function run(bin: 'ffmpeg' | 'ffprobe', args: string[]): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const out: Buffer[] = [];
    let err = '';
    child.stdout.on('data', (d: Buffer) => out.push(d));
    child.stderr.on('data', (d: Buffer) => {
      err += d.toString();
    });
    child.on('error', (e: NodeJS.ErrnoException) => {
      reject(
        e.code === 'ENOENT'
          ? new Error(`${bin} was not found on PATH. Install ffmpeg (https://ffmpeg.org/download.html) and try again.`)
          : e,
      );
    });
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout: Buffer.concat(out), stderr: err });
      else reject(new Error(`${bin} exited with code ${code}\n${err.split('\n').slice(-12).join('\n')}`));
    });
  });
}
