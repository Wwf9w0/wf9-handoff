import { mkdir, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { readRepositoryState } from '../../src/git/repository.js';
import {
  git,
  gitCommitAll,
  gitInit,
  TEST_COMMIT_DATE,
  useIsolatedGit,
  useTempDir,
  writeFiles,
} from '../helpers.js';

const NOW = new Date('2027-01-01T12:00:00Z');

describe('readRepositoryState', () => {
  const repoDir = useTempDir();
  useIsolatedGit();

  it('fails outside a Git repository', async () => {
    await expect(readRepositoryState(repoDir())).rejects.toThrow('is not inside a Git repository');
  });

  it('reads a repository without commits', async () => {
    gitInit(repoDir());
    await writeFiles(repoDir(), { 'a.txt': 'a' });

    expect(await readRepositoryState(repoDir(), NOW)).toEqual({
      schemaVersion: '1.0',
      root: '.',
      branch: 'main',
      head: null,
      recentCommits: [],
      changes: {
        staged: [],
        modified: [],
        deleted: [],
        renamed: [],
        untracked: ['a.txt'],
        conflicted: [],
      },
      capturedAt: NOW.toISOString(),
    });
  });

  it('reads HEAD and the ten most recent commits', async () => {
    gitInit(repoDir());
    for (let i = 1; i <= 12; i++) {
      await writeFiles(repoDir(), { 'counter.txt': String(i) });
      gitCommitAll(repoDir(), `commit ${String(i)}`);
    }

    const state = await readRepositoryState(repoDir());

    expect(state.head).toEqual({
      hash: git(repoDir(), 'rev-parse', 'HEAD').trim(),
      subject: 'commit 12',
      author: 'Ada Lovelace',
      date: TEST_COMMIT_DATE,
    });
    expect(state.recentCommits.map((commit) => commit.subject)).toEqual(
      Array.from({ length: 10 }, (_, i) => `commit ${String(12 - i)}`),
    );
    expect(state.recentCommits[0]).toEqual(state.head);
  });

  it('reports every kind of uncommitted change', async () => {
    gitInit(repoDir());
    await writeFiles(repoDir(), {
      'both.txt': 'v1',
      'edited.txt': 'v1',
      'gone.txt': 'v1',
      'old name.txt': 'v1',
      'removed.txt': 'v1',
    });
    gitCommitAll(repoDir(), 'initial');

    await writeFiles(repoDir(), { 'edited.txt': 'v2', 'both.txt': 'v2' });
    git(repoDir(), 'add', 'both.txt');
    await writeFiles(repoDir(), { 'both.txt': 'v3', 'added.txt': 'new', 'ideas/one.txt': '1' });
    git(repoDir(), 'add', 'added.txt');
    await rm(join(repoDir(), 'gone.txt'));
    git(repoDir(), 'rm', '--quiet', 'removed.txt');
    git(repoDir(), 'mv', 'old name.txt', 'new name.txt');

    expect((await readRepositoryState(repoDir())).changes).toEqual({
      staged: [
        { path: 'added.txt', status: 'added' },
        { path: 'both.txt', status: 'modified' },
        { path: 'new name.txt', status: 'renamed', from: 'old name.txt' },
        { path: 'removed.txt', status: 'deleted' },
      ],
      modified: ['both.txt', 'edited.txt'],
      deleted: ['gone.txt', 'removed.txt'],
      renamed: [{ from: 'old name.txt', to: 'new name.txt' }],
      untracked: ['ideas/'],
      conflicted: [],
    });
  });

  it('reports a detached HEAD', async () => {
    gitInit(repoDir());
    await writeFiles(repoDir(), { 'a.txt': 'a' });
    gitCommitAll(repoDir(), 'initial');
    git(repoDir(), 'checkout', '--quiet', '--detach');

    const state = await readRepositoryState(repoDir());

    expect(state.branch).toBeNull();
    expect(state.head?.subject).toBe('initial');
  });

  it('reports merge conflicts', async () => {
    gitInit(repoDir());
    await writeFiles(repoDir(), { 'shared.txt': 'base' });
    gitCommitAll(repoDir(), 'base');
    git(repoDir(), 'checkout', '--quiet', '-b', 'other');
    await writeFiles(repoDir(), { 'shared.txt': 'other' });
    gitCommitAll(repoDir(), 'other');
    git(repoDir(), 'checkout', '--quiet', 'main');
    await writeFiles(repoDir(), { 'shared.txt': 'main' });
    gitCommitAll(repoDir(), 'main');
    expect(() => git(repoDir(), 'merge', '--quiet', 'other')).toThrow();

    const state = await readRepositoryState(repoDir());

    expect(state.changes.conflicted).toEqual(['shared.txt']);
  });

  it('describes a project in a subdirectory relative to the Git root', async () => {
    gitInit(repoDir());
    const projectDir = join(repoDir(), 'apps', 'web');
    await mkdir(projectDir, { recursive: true });
    await writeFiles(repoDir(), { 'apps/web/page.ts': 'x', 'README.md': 'x' });

    const state = await readRepositoryState(projectDir);

    expect(state.root).toBe('../..');
    expect(state.changes.untracked).toEqual(['README.md', 'apps/']);
  });

  it('never writes to the repository, not even the index', async () => {
    gitInit(repoDir());
    await writeFiles(repoDir(), { 'a.txt': 'a' });
    gitCommitAll(repoDir(), 'initial');
    // A new timestamp makes a plain `git status` refresh and rewrite the index.
    const later = new Date(Date.now() + 60_000);
    await utimes(join(repoDir(), 'a.txt'), later, later);
    const indexBefore = await readFile(join(repoDir(), '.git', 'index'));

    await readRepositoryState(repoDir());

    expect(await readFile(join(repoDir(), '.git', 'index'))).toEqual(indexBefore);
  });

  it('reads a deleted file that Git no longer tracks as untracked when re-created', async () => {
    gitInit(repoDir());
    await writeFiles(repoDir(), { 'a.txt': 'a' });
    gitCommitAll(repoDir(), 'initial');
    git(repoDir(), 'rm', '--quiet', '--cached', 'a.txt');
    await writeFile(join(repoDir(), 'a.txt'), 'a');

    const { changes } = await readRepositoryState(repoDir());

    expect(changes.staged).toEqual([{ path: 'a.txt', status: 'deleted' }]);
    expect(changes.untracked).toEqual(['a.txt']);
  });
});
