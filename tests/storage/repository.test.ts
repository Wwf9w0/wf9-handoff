import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import type { RepositoryState } from '../../src/core/repository.js';
import { initHandoff } from '../../src/storage/init.js';
import { saveRepository } from '../../src/storage/repository.js';
import { useTempDir } from '../helpers.js';

const STATE: RepositoryState = {
  schemaVersion: '1.0',
  root: '.',
  branch: 'main',
  head: null,
  recentCommits: [],
  changes: { staged: [], modified: [], deleted: [], renamed: [], untracked: [], conflicted: [] },
  capturedAt: '2027-01-01T10:00:00.000Z',
};

describe('repository storage', () => {
  const projectDir = useTempDir();
  const repositoryPath = (): string => join(projectDir(), '.handoff', 'repository.json');
  const readRepositoryJson = async (): Promise<unknown> =>
    JSON.parse(await readFile(repositoryPath(), 'utf8')) as unknown;

  it('refuses to save before init', async () => {
    await expect(saveRepository(projectDir(), STATE)).rejects.toThrow('Handoff is not initialized');
  });

  describe('after init', () => {
    beforeEach(async () => {
      await initHandoff(projectDir());
    });

    it('creates repository.json, then updates it', async () => {
      expect(await saveRepository(projectDir(), STATE)).toBe('created');
      expect(await readRepositoryJson()).toEqual(STATE);

      expect(await saveRepository(projectDir(), { ...STATE, branch: 'dev' })).toBe('updated');
      expect(await readRepositoryJson()).toMatchObject({ branch: 'dev' });
    });

    it('replaces the file instead of merging with it', async () => {
      await writeFile(repositoryPath(), '{ "branch": "claimed-by-agent", "note": "hand-written" }');

      await saveRepository(projectDir(), STATE);

      expect(await readRepositoryJson()).toEqual(STATE);
    });
  });
});
