import { describe, expect, it } from 'vitest';

import type { Technology } from '../../src/core/technology.js';
import { scanTechnology, type TechnologyScan } from '../../src/scanner/technology.js';
import { useTempDir, writeFiles } from '../helpers.js';

const packageJson = (fields: Record<string, unknown> = {}): string =>
  JSON.stringify({ name: 'app', ...fields });

describe('scanTechnology: package.json', () => {
  const projectDir = useTempDir();
  const scan = async (files: Record<string, string>): Promise<TechnologyScan> => {
    await writeFiles(projectDir(), files);
    return scanTechnology(projectDir());
  };
  const detect = async (files: Record<string, string>): Promise<Technology> =>
    (await scan(files)).technology;

  it('detects a TypeScript CLI like this one', async () => {
    const result = await scan({
      'package.json': packageJson({
        packageManager: 'pnpm@12.4.2',
        engines: { node: '>=22.12.0' },
        dependencies: { commander: '^15.0.0' },
        devDependencies: { typescript: '~6.0.3', vitest: '^5.0.0' },
      }),
      'tsconfig.json': '{}',
      'pnpm-lock.yaml': '',
    });

    expect(result).toEqual({
      technology: {
        language: 'typescript',
        runtime: 'node',
        packageManager: 'pnpm',
        framework: null,
        testFramework: 'vitest',
      },
      manifests: ['package.json'],
      sources: ['package.json', 'tsconfig.json', 'pnpm-lock.yaml'],
    });
  });

  describe('language', () => {
    it('is javascript without signs of TypeScript', async () => {
      expect((await detect({ 'package.json': packageJson() })).language).toBe('javascript');
    });

    it('is typescript with a typescript dependency but no tsconfig.json', async () => {
      const technology = await detect({
        'package.json': packageJson({ devDependencies: { typescript: '^6.0.0' } }),
      });

      expect(technology.language).toBe('typescript');
    });
  });

  describe('runtime', () => {
    it.each([
      [{ engines: { node: '>=22' } }],
      [{ devDependencies: { '@types/node': '^24.0.0' } }],
      [{ dependencies: { express: '^5.0.0' } }],
      [{ scripts: { test: 'node --test' } }],
    ])('is node when package.json shows it: %o', async (fields) => {
      expect((await detect({ 'package.json': packageJson(fields) })).runtime).toBe('node');
    });

    it('is unknown otherwise, e.g. for a browser app', async () => {
      const technology = await detect({
        'package.json': packageJson({ dependencies: { react: '^19.0.0' } }),
      });

      expect(technology.runtime).toBe('unknown');
    });
  });

  describe('package manager', () => {
    it.each([
      ['pnpm-lock.yaml', 'pnpm'],
      ['package-lock.json', 'npm'],
      ['yarn.lock', 'yarn'],
      ['bun.lockb', 'bun'],
    ])('reads %s as %s', async (lockfile, manager) => {
      const result = await scan({ 'package.json': packageJson(), [lockfile]: '' });

      expect(result.technology.packageManager).toBe(manager);
      expect(result.sources).toEqual(['package.json', lockfile]);
    });

    it('prefers the packageManager field over lockfiles', async () => {
      const technology = await detect({
        'package.json': packageJson({ packageManager: 'yarn@4.5.0' }),
        'package-lock.json': '',
      });

      expect(technology.packageManager).toBe('yarn');
    });

    it.each([
      ['several lockfiles', { 'package-lock.json': '', 'yarn.lock': '' }],
      ['no lockfile', {}],
    ])('is unknown with %s', async (_case, lockfiles) => {
      const technology = await detect({ 'package.json': packageJson(), ...lockfiles });

      expect(technology.packageManager).toBe('unknown');
    });

    it('is unknown for a packageManager it does not know', async () => {
      const technology = await detect({
        'package.json': packageJson({ packageManager: 'cnpm@9.0.0' }),
        'pnpm-lock.yaml': '',
      });

      expect(technology.packageManager).toBe('unknown');
    });
  });

  describe('framework', () => {
    it('is null when no framework is listed', async () => {
      const technology = await detect({
        'package.json': packageJson({ dependencies: { lodash: '^4.0.0' } }),
      });

      expect(technology.framework).toBeNull();
    });

    it('reports the framework instead of the library it builds on', async () => {
      const technology = await detect({
        'package.json': packageJson({ dependencies: { next: '^16.0.0', react: '^19.0.0' } }),
      });

      expect(technology.framework).toBe('nextjs');
    });

    it('is unknown when unrelated frameworks are listed', async () => {
      const technology = await detect({
        'package.json': packageJson({ dependencies: { react: '^19.0.0', express: '^5.0.0' } }),
      });

      expect(technology.framework).toBe('unknown');
    });

    it.each([
      ['workspaces in package.json', { 'package.json': packageJson({ workspaces: ['apps/*'] }) }],
      [
        'a pnpm workspace',
        {
          'package.json': packageJson(),
          'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
        },
      ],
    ])('is unknown, not null, for a monorepo root with %s', async (_case, files) => {
      const technology = await detect(files);

      expect(technology.framework).toBe('unknown');
      expect(technology.testFramework).toBe('unknown');
    });

    it('does not treat a pnpm-workspace.yaml with only settings as a monorepo', async () => {
      const result = await scan({
        'package.json': packageJson(),
        'pnpm-workspace.yaml': 'onlyBuiltDependencies:\n  - esbuild\n',
      });

      expect(result.technology.framework).toBeNull();
      expect(result.sources).toContain('pnpm-workspace.yaml');
    });
  });

  describe('test framework', () => {
    it('detects jest', async () => {
      const technology = await detect({
        'package.json': packageJson({ devDependencies: { jest: '^30.0.0' } }),
      });

      expect(technology.testFramework).toBe('jest');
    });

    it('detects the built-in Node.js test runner from scripts', async () => {
      const technology = await detect({
        'package.json': packageJson({ scripts: { test: 'node --import tsx --test' } }),
      });

      expect(technology.testFramework).toBe('node:test');
    });

    it('is unknown when several runners are listed', async () => {
      const technology = await detect({
        'package.json': packageJson({ devDependencies: { jest: '^30.0.0', vitest: '^5.0.0' } }),
      });

      expect(technology.testFramework).toBe('unknown');
    });

    it('does not count end-to-end tools', async () => {
      const technology = await detect({
        'package.json': packageJson({ devDependencies: { '@playwright/test': '^1.50.0' } }),
      });

      expect(technology.testFramework).toBeNull();
    });
  });

  it('does not guess from a package.json that is not valid JSON', async () => {
    const technology = await detect({
      'package.json': '{ broken',
      'tsconfig.json': '{}',
      'yarn.lock': '',
    });

    expect(technology).toEqual({
      language: 'typescript',
      runtime: 'unknown',
      packageManager: 'yarn',
      framework: 'unknown',
      testFramework: 'unknown',
    });
  });
});
