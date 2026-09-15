import { stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { hasErrorCode } from './fs.js';
import { getHandoffPaths } from './paths.js';

/** A directory is a Handoff project once `.handoff/config.json` exists in it. */
export async function isInitialized(dir: string): Promise<boolean> {
  try {
    return (await stat(getHandoffPaths(dir).config)).isFile();
  } catch (error) {
    // ENOTDIR: `.handoff` exists but is a file.
    if (hasErrorCode(error, 'ENOENT') || hasErrorCode(error, 'ENOTDIR')) return false;
    throw error;
  }
}

/**
 * Finds the project containing `startDir`: the nearest initialized directory,
 * checking `startDir` first and then each parent, the way git finds `.git`.
 */
export async function findProjectRoot(startDir: string): Promise<string | undefined> {
  let dir = resolve(startDir);

  for (;;) {
    if (await isInitialized(dir)) return dir;

    const parent = dirname(dir);
    if (parent === dir) return undefined; // reached the filesystem root
    dir = parent;
  }
}

/** Like findProjectRoot, but fails with a helpful message when there is no project. */
export async function requireProjectRoot(startDir: string): Promise<string> {
  const root = await findProjectRoot(startDir);
  if (root === undefined) {
    throw new Error(
      `Handoff is not initialized in ${resolve(startDir)} or any parent directory. Run "wf9 init" first.`,
    );
  }
  return root;
}
