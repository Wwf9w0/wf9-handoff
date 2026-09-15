import { mkdir, stat, writeFile } from 'node:fs/promises';

import { createConfig } from '../core/config.js';
import { hasErrorCode, toJson } from './fs.js';
import { getHandoffPaths, type HandoffPaths } from './paths.js';
import { findProjectRoot } from './project-root.js';

export type InitResult =
  | { status: 'initialized'; paths: HandoffPaths; createdDir: boolean; createdConfig: boolean }
  | { status: 'already-initialized'; paths: HandoffPaths }
  /** A parent directory is already a Handoff project, so nothing was created. */
  | { status: 'inside-project'; root: string };

/**
 * Creates `.handoff/config.json` under `rootDir`. Safe to run repeatedly:
 * anything that already exists is left untouched.
 */
export async function initHandoff(rootDir: string, now = new Date()): Promise<InitResult> {
  const paths = getHandoffPaths(rootDir);

  // Never nest a second .handoff inside an existing project.
  const existingRoot = await findProjectRoot(paths.root);
  if (existingRoot !== undefined && existingRoot !== paths.root) {
    return { status: 'inside-project', root: existingRoot };
  }

  const createdDir = await createDirIfMissing(paths.dir);
  const createdConfig = await createFileIfMissing(paths.config, toJson(createConfig(now)));

  if (!createdDir && !createdConfig) return { status: 'already-initialized', paths };
  return { status: 'initialized', paths, createdDir, createdConfig };
}

async function createDirIfMissing(dir: string): Promise<boolean> {
  try {
    await mkdir(dir);
    return true;
  } catch (error) {
    if (!hasErrorCode(error, 'EEXIST')) throw error;
  }

  if (!(await stat(dir)).isDirectory()) {
    throw new Error(`${dir} exists but is not a directory`);
  }
  return false;
}

async function createFileIfMissing(file: string, content: string): Promise<boolean> {
  try {
    // 'wx' makes the OS refuse to open an existing file, so there is no gap
    // between "check if it exists" and "write it" where data could be lost.
    await writeFile(file, content, { flag: 'wx' });
    return true;
  } catch (error) {
    if (hasErrorCode(error, 'EEXIST')) return false;
    throw error;
  }
}
