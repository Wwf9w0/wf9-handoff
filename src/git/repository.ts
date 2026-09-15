import { realpath } from 'node:fs/promises';
import { relative } from 'node:path';

import { REPOSITORY_SCHEMA_VERSION, type RepositoryState } from '../core/repository.js';
import { logArgs, parseLog } from './log.js';
import { GitError, runGit } from './run.js';
import { parseStatus, STATUS_ARGS } from './status.js';

export const RECENT_COMMIT_LIMIT = 10;

/** Asks Git for the current state of the repository containing `projectRoot`. Read-only. */
export async function readRepositoryState(
  projectRoot: string,
  now = new Date(),
): Promise<RepositoryState> {
  const gitRoot = await findGitRoot(projectRoot);
  const status = parseStatus(await runGit(projectRoot, STATUS_ARGS));
  // Log from the HEAD that status saw, so both describe the same moment even
  // if a commit lands in between.
  const recentCommits =
    status.headHash === null
      ? []
      : parseLog(await runGit(projectRoot, [...logArgs(RECENT_COMMIT_LIMIT), status.headHash]));

  return {
    schemaVersion: REPOSITORY_SCHEMA_VERSION,
    root: relative(await realpath(projectRoot), gitRoot) || '.',
    branch: status.branch,
    head: recentCommits[0] ?? null,
    recentCommits,
    changes: status.changes,
    capturedAt: now.toISOString(),
  };
}

async function findGitRoot(projectRoot: string): Promise<string> {
  try {
    return (await runGit(projectRoot, ['rev-parse', '--show-toplevel'])).trim();
  } catch (error) {
    if (error instanceof GitError && error.stderr.includes('not a git repository')) {
      throw new Error(`${projectRoot} is not inside a Git repository.`, { cause: error });
    }
    throw error;
  }
}
