import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { initHandoff } from '../../src/storage/init.js';
import { useTempDir } from '../helpers.js';

const NOW = new Date('2027-01-01T10:00:00Z');

describe('initHandoff', () => {
  const projectDir = useTempDir();
  const handoffDir = (): string => join(projectDir(), '.handoff');
  const configPath = (): string => join(handoffDir(), 'config.json');

  it('creates .handoff/config.json with schemaVersion and createdAt', async () => {
    const result = await initHandoff(projectDir(), NOW);

    expect(result).toMatchObject({
      status: 'initialized',
      paths: { config: configPath() },
      createdDir: true,
      createdConfig: true,
    });
    expect(JSON.parse(await readFile(configPath(), 'utf8')) as unknown).toEqual({
      schemaVersion: '1.0',
      createdAt: '2027-01-01T10:00:00.000Z',
    });
  });

  it('does not overwrite an existing config when run again', async () => {
    await initHandoff(projectDir(), NOW);
    await writeFile(configPath(), '{ "edited": "by user" }');

    const result = await initHandoff(projectDir(), new Date('2028-06-01T00:00:00Z'));

    expect(result.status).toBe('already-initialized');
    expect(await readFile(configPath(), 'utf8')).toBe('{ "edited": "by user" }');
  });

  it('adds a missing config to an existing .handoff directory without touching other files', async () => {
    await mkdir(handoffDir());
    await writeFile(join(handoffDir(), 'notes.md'), 'keep me');

    const result = await initHandoff(projectDir(), NOW);

    expect(result).toMatchObject({ status: 'initialized', createdDir: false, createdConfig: true });
    expect(await readFile(join(handoffDir(), 'notes.md'), 'utf8')).toBe('keep me');
  });

  it('fails without changes when .handoff is a file', async () => {
    await writeFile(handoffDir(), 'not a directory');

    await expect(initHandoff(projectDir(), NOW)).rejects.toThrow('exists but is not a directory');
    expect(await readFile(handoffDir(), 'utf8')).toBe('not a directory');
  });

  it('does not nest a second .handoff inside an initialized project', async () => {
    const subDir = join(projectDir(), 'src', 'components');
    await mkdir(subDir, { recursive: true });
    await initHandoff(projectDir(), NOW);

    const result = await initHandoff(subDir, NOW);

    expect(result).toEqual({ status: 'inside-project', root: projectDir() });
    expect(existsSync(join(subDir, '.handoff'))).toBe(false);
  });
});
