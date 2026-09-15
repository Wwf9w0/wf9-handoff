import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runCli, useTempCwd, writeFiles } from '../helpers.js';

const TS_PROJECT = {
  'package.json': JSON.stringify({
    engines: { node: '>=22' },
    devDependencies: { typescript: '^6.0.0', vitest: '^5.0.0' },
  }),
  'tsconfig.json': '{}',
  'pnpm-lock.yaml': '',
};

describe('wf9 scan', () => {
  const projectDir = useTempCwd();
  const readProjectJson = async (): Promise<Record<string, unknown>> =>
    JSON.parse(await readFile(join(projectDir(), '.handoff', 'project.json'), 'utf8')) as Record<
      string,
      unknown
    >;

  // No terminal, so `project setup` takes its values from options only.
  const originalIsTTY = process.stdin.isTTY;
  beforeEach(() => {
    process.stdin.isTTY = false;
  });
  afterEach(() => {
    process.stdin.isTTY = originalIsTTY;
  });

  /** Sets up an identity before any project files exist, so nothing is detected yet. */
  const setUpProject = async (): Promise<void> => {
    await runCli(['init']);
    await runCli(['project', 'setup', '-n', 'app', '-d', 'An app']);
  };

  it('fails when Handoff is not initialized', async () => {
    await expect(runCli(['scan'])).rejects.toThrow('Handoff is not initialized');
  });

  it('explains how to set up a missing identity', async () => {
    await runCli(['init']);

    await expect(runCli(['scan'])).rejects.toThrow(
      'No project identity yet. Run "wf9 project setup" first.',
    );
  });

  it('saves the detected technology to project.json', async () => {
    await setUpProject();
    await writeFiles(projectDir(), TS_PROJECT);

    const result = await runCli(['scan']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(
      [
        '✓ Technology saved to project.json',
        '',
        'Language:        typescript',
        'Runtime:         node',
        'Package manager: pnpm',
        'Framework:       none',
        'Test framework:  vitest',
        '',
        'Detected from: package.json, tsconfig.json, pnpm-lock.yaml',
        '',
      ].join('\n'),
    );
    expect(await readProjectJson()).toMatchObject({
      schemaVersion: '1.1',
      name: 'app',
      technology: {
        language: 'typescript',
        runtime: 'node',
        packageManager: 'pnpm',
        framework: null,
        testFramework: 'vitest',
      },
    });
  });

  it('reports when nothing changed and leaves the file alone', async () => {
    await setUpProject();
    await writeFiles(projectDir(), TS_PROJECT);
    await runCli(['scan']);
    const before = await readProjectJson();

    const result = await runCli(['scan']);

    expect(result.stdout).toMatch(/^Technology is unchanged\.\n/);
    expect((await readProjectJson())['updatedAt']).toBe(before['updatedAt']);
  });

  it('scans the project root when run from a subdirectory', async () => {
    await writeFiles(projectDir(), { 'go.mod': 'module example.com/app\n' });
    await setUpProject();
    const subDir = join(projectDir(), 'web');
    await mkdir(subDir);
    await writeFiles(subDir, { 'package.json': '{}' });
    vi.spyOn(process, 'cwd').mockReturnValue(subDir);

    const result = await runCli(['scan']);

    expect(result.stdout).toContain('Language:        go\n');
    expect(result.stdout).toContain('Detected from: go.mod');
  });

  it('says which files it looked for when it finds none', async () => {
    await setUpProject();

    const result = await runCli(['scan']);

    expect(result.stdout).toContain('Language:        unknown\n');
    expect(result.stdout).toContain(
      'No project files found (looked for package.json, pom.xml, pubspec.yaml, Cargo.toml, go.mod).',
    );
  });

  it('explains why a mixed project is unknown', async () => {
    await setUpProject();
    await writeFiles(projectDir(), { 'package.json': '{}', 'pom.xml': '<project/>' });

    const result = await runCli(['scan']);

    expect(result.stdout).toContain('Found several kinds of project (package.json, pom.xml).');
  });
});
