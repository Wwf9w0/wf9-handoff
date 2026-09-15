import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import { initHandoff } from '../../src/storage/init.js';
import {
  findProjectRoot,
  isInitialized,
  requireProjectRoot,
} from '../../src/storage/project-root.js';
import { useTempDir } from '../helpers.js';

describe('isInitialized', () => {
  const projectDir = useTempDir();

  it('is false before init and true after', async () => {
    expect(await isInitialized(projectDir())).toBe(false);
    await initHandoff(projectDir());
    expect(await isInitialized(projectDir())).toBe(true);
  });

  it('is false when .handoff is a file', async () => {
    await writeFile(join(projectDir(), '.handoff'), '');

    expect(await isInitialized(projectDir())).toBe(false);
  });
});

describe('findProjectRoot', () => {
  const projectDir = useTempDir();
  const subDir = (): string => join(projectDir(), 'src', 'components');

  beforeEach(async () => {
    await mkdir(subDir(), { recursive: true });
  });

  it('finds nothing outside a project', async () => {
    expect(await findProjectRoot(subDir())).toBeUndefined();
  });

  it('finds the start directory itself', async () => {
    await initHandoff(projectDir());

    expect(await findProjectRoot(projectDir())).toBe(projectDir());
  });

  it('walks up from a subdirectory to the project root', async () => {
    await initHandoff(projectDir());

    expect(await findProjectRoot(subDir())).toBe(projectDir());
  });

  it('ignores a .handoff directory without config.json', async () => {
    await initHandoff(projectDir());
    await mkdir(join(subDir(), '.handoff'));

    expect(await findProjectRoot(subDir())).toBe(projectDir());
  });
});

describe('requireProjectRoot', () => {
  const projectDir = useTempDir();

  it('explains how to initialize when there is no project', async () => {
    await expect(requireProjectRoot(projectDir())).rejects.toThrow(
      `Handoff is not initialized in ${projectDir()} or any parent directory. Run "wf9 init" first.`,
    );
  });
});
