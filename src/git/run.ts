import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { hasErrorCode } from '../storage/fs.js';

const execFileAsync = promisify(execFile);

/** Git exited with an error; `stderr` holds its message. */
export class GitError extends Error {
  constructor(
    readonly args: readonly string[],
    readonly stderr: string,
  ) {
    super(`git ${args.join(' ')} failed: ${stderr || 'no error message'}`);
    this.name = 'GitError';
  }
}

/**
 * Runs a read-only Git command in `cwd` and returns its output.
 *
 * Git runs directly, not through a shell, so paths are never interpreted as
 * shell syntax. `--no-optional-locks` stops even `git status` from refreshing
 * the index, so inspecting a repository never writes to it.
 */
export async function runGit(cwd: string, args: readonly string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', ['--no-optional-locks', ...args], {
      cwd,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      // English messages, so errors read the same on every machine.
      env: { ...process.env, LC_ALL: 'C' },
    });
    return stdout;
  } catch (error) {
    if (hasErrorCode(error, 'ENOENT')) {
      throw new Error('Git is not installed or not on PATH.', { cause: error });
    }
    const stderr = hasStderr(error) ? error.stderr.trim() : '';
    throw new GitError(args, stderr);
  }
}

function hasStderr(error: unknown): error is { stderr: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'stderr' in error &&
    typeof error.stderr === 'string'
  );
}
