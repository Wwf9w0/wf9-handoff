import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { devNull, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { type Command, CommanderError, type OutputConfiguration } from 'commander';
import { afterEach, beforeEach, vi } from 'vitest';

import { createProgram } from '../src/cli/program.js';

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Runs the CLI in-process, capturing output instead of exiting the test runner.
 * Errors thrown by commands (not Commander usage errors) are re-thrown.
 */
export async function runCli(args: string[]): Promise<RunResult> {
  let stdout = '';
  let stderr = '';

  const program = createProgram();
  configureForTest(program, {
    writeOut: (text) => (stdout += text),
    writeErr: (text) => (stderr += text),
  });
  const log = vi.spyOn(console, 'log').mockImplementation((message: unknown) => {
    stdout += `${String(message)}\n`;
  });

  try {
    await program.parseAsync(args, { from: 'user' });
    return { stdout, stderr, exitCode: 0 };
  } catch (error) {
    if (error instanceof CommanderError) {
      return { stdout, stderr, exitCode: error.exitCode };
    }
    throw error;
  } finally {
    log.mockRestore();
  }
}

/** Subcommands copy these settings only when created, so apply them to each one. */
function configureForTest(command: Command, output: OutputConfiguration): void {
  command.exitOverride().configureOutput(output);
  for (const subcommand of command.commands) {
    configureForTest(subcommand, output);
  }
}

/**
 * Gives each test a fresh empty directory, deleted afterwards.
 * Call at the top of a `describe` block; read the path inside tests.
 */
export function useTempDir(): () => string {
  let dir = '';

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'handoff-test-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  return () => dir;
}

/** Writes `{ "relative/path": "content" }` entries under `dir`, creating folders as needed. */
export async function writeFiles(dir: string, files: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(files).map(async ([name, content]) => {
      const file = join(dir, name);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, content);
    }),
  );
}

export const TEST_COMMIT_DATE = '2027-01-01T10:00:00+03:00';

/** No user or system config, and a fixed identity and date, so Git behaves the same everywhere. */
const TEST_GIT_ENV = {
  GIT_CONFIG_GLOBAL: devNull,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Ada Lovelace',
  GIT_AUTHOR_EMAIL: 'ada@example.com',
  GIT_AUTHOR_DATE: TEST_COMMIT_DATE,
  GIT_COMMITTER_NAME: 'Ada Lovelace',
  GIT_COMMITTER_EMAIL: 'ada@example.com',
  GIT_COMMITTER_DATE: TEST_COMMIT_DATE,
};

/**
 * Variables like GIT_DIR, set when tests run from a Git hook, would point Git
 * at this repository instead of the test's temporary one.
 */
const inheritedGitVariables = (): string[] =>
  Object.keys(process.env).filter((name) => name.startsWith('GIT_'));

/** Runs Git in `dir` to set up a test, and returns its output. */
export function git(dir: string, ...args: string[]): string {
  const env = { ...process.env };
  for (const name of inheritedGitVariables()) env[name] = undefined;

  return execFileSync('git', args, {
    cwd: dir,
    encoding: 'utf8',
    env: { ...env, ...TEST_GIT_ENV },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** `git init` with a fixed branch name, whatever the machine's default is. */
export function gitInit(dir: string): void {
  git(dir, 'init', '--quiet', '--initial-branch=main');
}

/** Stages everything and commits it. */
export function gitCommitAll(dir: string, message: string): void {
  git(dir, 'add', '--all');
  git(dir, 'commit', '--quiet', '--message', message);
}

/**
 * Gives the code under test the same clean Git environment as `git()`.
 * Call at the top of a `describe` block.
 */
export function useIsolatedGit(): void {
  beforeEach(() => {
    for (const name of inheritedGitVariables()) vi.stubEnv(name, undefined);
    for (const [name, value] of Object.entries(TEST_GIT_ENV)) vi.stubEnv(name, value);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });
}

/** Like useTempDir, but also makes the directory the CLI's `process.cwd()`. */
export function useTempCwd(): () => string {
  const dir = useTempDir();

  beforeEach(() => {
    vi.spyOn(process, 'cwd').mockReturnValue(dir());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  return dir;
}
