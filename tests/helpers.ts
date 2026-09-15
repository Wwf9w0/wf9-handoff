import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
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
