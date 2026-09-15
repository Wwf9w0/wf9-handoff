import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { runCli, useTempCwd } from '../helpers.js';

describe('wf9 init', () => {
  const projectDir = useTempCwd();

  it('initializes the current working directory', async () => {
    const result = await runCli(['init']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(
      '✓ .handoff directory created\n✓ config.json created\n\nHandoff initialized.\n',
    );
    expect(existsSync(join(projectDir(), '.handoff', 'config.json'))).toBe(true);
  });

  it('reports only the missing config when .handoff already exists', async () => {
    await mkdir(join(projectDir(), '.handoff'));

    const result = await runCli(['init']);

    expect(result.stdout).toBe('✓ config.json created\n\nHandoff initialized.\n');
  });

  it('says it is already initialized on the second run', async () => {
    await runCli(['init']);

    const result = await runCli(['init']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('Handoff is already initialized.\n');
  });

  it('points to the existing project instead of nesting one in a subdirectory', async () => {
    await runCli(['init']);
    const subDir = join(projectDir(), 'src');
    await mkdir(subDir);
    vi.spyOn(process, 'cwd').mockReturnValue(subDir);

    const result = await runCli(['init']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(
      `Handoff is already initialized in a parent directory: ${projectDir()}\n`,
    );
    expect(existsSync(join(subDir, '.handoff'))).toBe(false);
  });
});
