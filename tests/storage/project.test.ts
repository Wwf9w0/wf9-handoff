import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import type { Technology } from '../../src/core/technology.js';
import { initHandoff } from '../../src/storage/init.js';
import { readProject, saveProject } from '../../src/storage/project.js';
import { useTempDir } from '../helpers.js';

const NOW = new Date('2027-01-01T10:00:00Z');
const LATER = new Date('2027-02-01T10:00:00Z');
const INPUT = { name: 'handoff', description: 'Cross-agent project continuity tool' };
const TECHNOLOGY: Technology = {
  language: 'typescript',
  runtime: 'node',
  packageManager: 'pnpm',
  framework: null,
  testFramework: 'vitest',
};

describe('project storage', () => {
  const projectDir = useTempDir();
  const projectPath = (): string => join(projectDir(), '.handoff', 'project.json');

  describe('before init', () => {
    it('refuses to read or save', async () => {
      await expect(readProject(projectDir())).rejects.toThrow('Handoff is not initialized');
      await expect(saveProject(projectDir(), INPUT)).rejects.toThrow('Handoff is not initialized');
    });
  });

  describe('after init', () => {
    beforeEach(async () => {
      await initHandoff(projectDir());
    });

    it('reads nothing before setup', async () => {
      expect(await readProject(projectDir())).toBeUndefined();
    });

    it('creates project.json', async () => {
      const result = await saveProject(projectDir(), INPUT, NOW);

      expect(result.status).toBe('created');
      expect(await readProject(projectDir())).toEqual(result.project);
      expect(JSON.parse(await readFile(projectPath(), 'utf8')) as unknown).toEqual({
        schemaVersion: '1.1',
        ...INPUT,
        root: '.',
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      });
    });

    it('updates project.json and keeps createdAt', async () => {
      await saveProject(projectDir(), INPUT, NOW);

      const result = await saveProject(projectDir(), { ...INPUT, description: 'New' }, LATER);

      expect(result.status).toBe('updated');
      expect(await readProject(projectDir())).toMatchObject({
        description: 'New',
        createdAt: NOW.toISOString(),
        updatedAt: LATER.toISOString(),
      });
    });

    it('does not touch the file when nothing changed', async () => {
      await saveProject(projectDir(), INPUT, NOW);

      const result = await saveProject(projectDir(), INPUT, LATER);

      expect(result.status).toBe('unchanged');
      expect((await readProject(projectDir()))?.updatedAt).toBe(NOW.toISOString());
    });

    it('saves technology and keeps it when only the identity changes', async () => {
      await saveProject(projectDir(), { ...INPUT, technology: TECHNOLOGY }, NOW);

      await saveProject(projectDir(), { ...INPUT, description: 'New' }, LATER);

      expect((await readProject(projectDir()))?.technology).toEqual(TECHNOLOGY);
    });

    it('updates when only the technology changed', async () => {
      await saveProject(projectDir(), { ...INPUT, technology: TECHNOLOGY }, NOW);

      const result = await saveProject(
        projectDir(),
        { ...INPUT, technology: { ...TECHNOLOGY, framework: 'express' } },
        LATER,
      );

      expect(result.status).toBe('updated');
      expect((await readProject(projectDir()))?.technology?.framework).toBe('express');
    });

    it('does not touch the file when the same technology is saved again', async () => {
      await saveProject(projectDir(), { ...INPUT, technology: TECHNOLOGY }, NOW);

      const result = await saveProject(projectDir(), { ...INPUT, technology: TECHNOLOGY }, LATER);

      expect(result.status).toBe('unchanged');
    });

    it('leaves no temporary files behind', async () => {
      await saveProject(projectDir(), INPUT, NOW);

      expect((await readdir(join(projectDir(), '.handoff'))).sort()).toEqual([
        'config.json',
        'project.json',
      ]);
    });

    it('reports a file that is not JSON', async () => {
      await writeFile(projectPath(), '{ broken');

      await expect(readProject(projectDir())).rejects.toThrow('project.json is not valid JSON');
    });

    it('reports a file with the wrong shape', async () => {
      await writeFile(projectPath(), '{ "name": "handoff" }');

      await expect(readProject(projectDir())).rejects.toThrow(
        /Invalid .*project\.json: "schemaVersion" must be a string/,
      );
    });
  });
});
