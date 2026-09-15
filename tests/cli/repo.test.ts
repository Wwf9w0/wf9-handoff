import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  git,
  gitCommitAll,
  gitInit,
  runCli,
  TEST_COMMIT_DATE,
  useIsolatedGit,
  useTempCwd,
  writeFiles,
} from '../helpers.js';

describe('wf9 repo', () => {
  const projectDir = useTempCwd();
  useIsolatedGit();
  const readRepositoryJson = async (): Promise<Record<string, unknown>> =>
    JSON.parse(await readFile(join(projectDir(), '.handoff', 'repository.json'), 'utf8')) as Record<
      string,
      unknown
    >;

  /** A committed repository whose .gitignore keeps .handoff/ out of the changes. */
  const setUpRepository = async (): Promise<string> => {
    gitInit(projectDir());
    await writeFiles(projectDir(), { '.gitignore': '.handoff/\n', 'app.ts': 'v1' });
    gitCommitAll(projectDir(), 'feat: first commit');
    await runCli(['init']);
    return git(projectDir(), 'rev-parse', '--short=7', 'HEAD').trim();
  };

  it('fails when Handoff is not initialized', async () => {
    gitInit(projectDir());

    await expect(runCli(['repo'])).rejects.toThrow('Handoff is not initialized');
  });

  it('fails outside a Git repository', async () => {
    await runCli(['init']);

    await expect(runCli(['repo'])).rejects.toThrow('is not inside a Git repository');
  });

  it('saves repository.json and prints a clean repository', async () => {
    const hash = await setUpRepository();

    const result = await runCli(['repo']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(
      [
        '✓ repository.json created',
        '',
        'Branch:   main',
        `HEAD:     ${hash} feat: first commit`,
        '',
        'Recent commits (1):',
        `  ${TEST_COMMIT_DATE.slice(0, 10)} ${hash} feat: first commit`,
        '',
        'Working tree clean.',
        '',
      ].join('\n'),
    );
    expect(await readRepositoryJson()).toMatchObject({
      schemaVersion: '1.0',
      root: '.',
      branch: 'main',
      head: { subject: 'feat: first commit', author: 'Ada Lovelace', date: TEST_COMMIT_DATE },
    });
  });

  it('prints each kind of change', async () => {
    await setUpRepository();
    await writeFiles(projectDir(), { 'app.ts': 'v2', 'notes.md': 'todo' });
    git(projectDir(), 'add', 'app.ts');

    const result = await runCli(['repo']);

    expect(result.stdout).toContain(
      ['Staged (1):', '  modified     app.ts', '', 'Modified (1):', '  app.ts'].join('\n'),
    );
    expect(result.stdout).toContain('Untracked (1):\n  notes.md\n');
    expect(result.stdout).not.toContain('Working tree clean.');
  });

  it('reports a later run as an update', async () => {
    await setUpRepository();
    await runCli(['repo']);

    const result = await runCli(['repo']);

    expect(result.stdout).toMatch(/^✓ repository\.json updated\n/);
  });

  it('shortens long lists in the terminal but saves all of them', async () => {
    await setUpRepository();
    await writeFiles(
      projectDir(),
      Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`new-${String(i)}.txt`, 'x'])),
    );

    const result = await runCli(['repo']);

    expect(result.stdout).toContain('Untracked (25):\n');
    expect(result.stdout).toContain('  ... and 5 more in repository.json\n');
    expect(await readRepositoryJson()).toMatchObject({
      changes: { untracked: expect.arrayContaining(['new-24.txt']) as unknown },
    });
  });

  it('captures the whole repository when run from a subdirectory', async () => {
    await setUpRepository();
    const subDir = join(projectDir(), 'src');
    await mkdir(subDir);
    await writeFiles(projectDir(), { 'top.txt': 'x' });
    vi.spyOn(process, 'cwd').mockReturnValue(subDir);

    await runCli(['repo']);

    expect(await readRepositoryJson()).toMatchObject({ changes: { untracked: ['top.txt'] } });
  });
});
