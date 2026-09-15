import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { runCli } from '../helpers.js';

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { version: string };

describe('wf9 CLI', () => {
  it.each([['--version'], ['-v']])('prints the package version with %s', async (flag) => {
    const result = await runCli([flag]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(packageJson.version);
  });

  it.each([['--help'], ['-h']])('prints usage with %s', async (flag) => {
    const result = await runCli([flag]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage: wf9');
    expect(result.stdout).toContain('Switch AI agents without restarting the work.');
    expect(result.stdout).toContain('init');
    expect(result.stdout).toContain('project');
  });

  it('prints help and fails when run without a command', async () => {
    const result = await runCli([]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Usage: wf9');
  });

  it('rejects unknown options', async () => {
    const result = await runCli(['--nope']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("unknown option '--nope'");
  });

  it('rejects unknown commands', async () => {
    const result = await runCli(['nope']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("unknown command 'nope'");
  });
});
