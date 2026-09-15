import type { RepositoryState } from '../core/repository.js';
import { isFile, writeJsonFile } from './fs.js';
import { getHandoffPaths } from './paths.js';
import { assertInitialized } from './project-root.js';

export type RepositorySaveStatus = 'created' | 'updated';

/**
 * Writes `.handoff/repository.json`. The previous capture is replaced, never
 * merged: whatever the file said before, Git's current answer wins.
 */
export async function saveRepository(
  rootDir: string,
  state: RepositoryState,
): Promise<RepositorySaveStatus> {
  await assertInitialized(rootDir);
  const file = getHandoffPaths(rootDir).repository;

  const existed = await isFile(file);
  await writeJsonFile(file, state);
  return existed ? 'updated' : 'created';
}
