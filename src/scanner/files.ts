import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { hasErrorCode } from '../storage/fs.js';

/** Reads a file in the project root, or returns `undefined` if there is none. */
export async function readProjectFile(root: string, name: string): Promise<string | undefined> {
  try {
    return await readFile(join(root, name), 'utf8');
  } catch (error) {
    // EISDIR: a directory with the file's name is not the file.
    if (hasErrorCode(error, 'ENOENT') || hasErrorCode(error, 'EISDIR')) return undefined;
    throw error;
  }
}

/** Returns the names that exist as files in the project root, in the given order. */
export async function findProjectFiles(root: string, names: readonly string[]): Promise<string[]> {
  const found = await Promise.all(
    names.map(async (name) => ((await isFile(join(root, name))) ? name : undefined)),
  );
  return found.filter((name) => name !== undefined);
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (hasErrorCode(error, 'ENOENT')) return false;
    throw error;
  }
}
