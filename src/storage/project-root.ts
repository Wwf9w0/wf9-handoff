import { dirname, resolve } from 'node:path';

import { isFile } from './fs.js';
import { getHandoffPaths } from './paths.js';

/** A directory is a Handoff project once `.handoff/config.json` exists in it. */
export async function isInitialized(dir: string): Promise<boolean> {
  return isFile(getHandoffPaths(dir).config);
}

/** Fails unless `dir` itself is initialized, for storage functions given a project root. */
export async function assertInitialized(dir: string): Promise<void> {
  if (!(await isInitialized(dir))) {
    throw new Error(
      `Handoff is not initialized in ${getHandoffPaths(dir).root}. Run "wf9 init" first.`,
    );
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
