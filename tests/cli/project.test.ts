import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runCli, useTempCwd } from '../helpers.js';

const NAME = 'handoff';
const DESCRIPTION = 'Cross-agent project continuity tool';

describe('wf9 project', () => {
  const projectDir = useTempCwd();
  const readProjectJson = async (): Promise<Record<string, unknown>> =>
    JSON.parse(await readFile(join(projectDir(), '.handoff', 'project.json'), 'utf8')) as Record<
      string,
      unknown
    >;

  // Behave like an agent or CI run: no terminal, so nothing is prompted.
  const originalIsTTY = process.stdin.isTTY;
  beforeEach(() => {
    process.stdin.isTTY = false;
  });
  afterEach(() => {
    process.stdin.isTTY = originalIsTTY;
  });

  describe('setup', () => {
    it('fails when Handoff is not initialized', async () => {
      await expect(
        runCli(['project', 'setup', '--name', NAME, '--description', DESCRIPTION]),
      ).rejects.toThrow('Handoff is not initialized');
    });

    it('creates project.json from options', async () => {
      await runCli(['init']);

      const result = await runCli([
        'project',
        'setup',
        '--name',
        NAME,
        '--description',
        DESCRIPTION,
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/^✓ project\.json created\n\nName: +handoff\n/);
      const project = await readProjectJson();
      expect(project).toMatchObject({
        schemaVersion: '1.0',
        name: NAME,
        description: DESCRIPTION,
        root: '.',
      });
      expect(project['createdAt']).toBe(project['updatedAt']);
    });

    it('updates one field and keeps the rest', async () => {
      await runCli(['init']);
      await runCli(['project', 'setup', '-n', NAME, '-d', DESCRIPTION]);
      const before = await readProjectJson();

      const result = await runCli(['project', 'setup', '-d', 'A better description']);

      expect(result.stdout).toMatch(/^✓ project\.json updated\n/);
      expect(await readProjectJson()).toMatchObject({
        name: NAME,
        description: 'A better description',
        createdAt: before['createdAt'],
      });
    });

    it('reports when nothing changed', async () => {
      await runCli(['init']);
      await runCli(['project', 'setup', '-n', NAME, '-d', DESCRIPTION]);

      const result = await runCli(['project', 'setup', '-n', NAME, '-d', DESCRIPTION]);

      expect(result.stdout).toMatch(/^Project identity is unchanged\.\n/);
    });

    it('asks for missing options when not in a terminal', async () => {
      await runCli(['init']);

      await expect(runCli(['project', 'setup', '--name', NAME])).rejects.toThrow(
        'Missing --description.',
      );
    });

    it('saves to the project root when run from a subdirectory', async () => {
      await runCli(['init']);
      const subDir = join(projectDir(), 'src', 'components');
      await mkdir(subDir, { recursive: true });
      vi.spyOn(process, 'cwd').mockReturnValue(subDir);

      await runCli(['project', 'setup', '-n', NAME, '-d', DESCRIPTION]);

      expect(await readProjectJson()).toMatchObject({ name: NAME, root: '.' });
      expect(existsSync(join(subDir, '.handoff'))).toBe(false);
    });

    it('rejects an empty name', async () => {
      await runCli(['init']);

      await expect(runCli(['project', 'setup', '-n', '  ', '-d', DESCRIPTION])).rejects.toThrow(
        'Project name cannot be empty.',
      );
    });
  });

  describe('show', () => {
    it('prints the saved identity', async () => {
      await runCli(['init']);
      await runCli(['project', 'setup', '-n', NAME, '-d', DESCRIPTION]);

      const result = await runCli(['project', 'show']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(`Name:        ${NAME}\n`);
      expect(result.stdout).toContain(`Description: ${DESCRIPTION}\n`);
      expect(result.stdout).toContain('Root:        .\n');
    });

    it('finds the project from a subdirectory', async () => {
      await runCli(['init']);
      await runCli(['project', 'setup', '-n', NAME, '-d', DESCRIPTION]);
      const subDir = join(projectDir(), 'src');
      await mkdir(subDir);
      vi.spyOn(process, 'cwd').mockReturnValue(subDir);

      const result = await runCli(['project', 'show']);

      expect(result.stdout).toContain(`Name:        ${NAME}\n`);
    });

    it('explains how to set up a missing identity', async () => {
      await runCli(['init']);

      await expect(runCli(['project', 'show'])).rejects.toThrow(
        'No project identity yet. Run "wf9 project setup" first.',
      );
    });

    it('fails when Handoff is not initialized', async () => {
      await expect(runCli(['project', 'show'])).rejects.toThrow('Handoff is not initialized');
    });
  });
});
