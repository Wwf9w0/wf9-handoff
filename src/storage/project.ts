import {
  buildProject,
  parseProject,
  type ProjectIdentity,
  type ProjectInput,
} from '../core/project.js';
import { isSameTechnology } from '../core/technology.js';
import { readJsonFile, writeJsonFile } from './fs.js';
import { getHandoffPaths } from './paths.js';
import { assertInitialized } from './project-root.js';

export type SaveStatus = 'created' | 'updated' | 'unchanged';

export interface SaveProjectResult {
  project: ProjectIdentity;
  status: SaveStatus;
}

/**
 * Reads `.handoff/project.json`. Returns `undefined` if no identity has been
 * set up yet, and throws if Handoff is not initialized or the file is invalid.
 */
export async function readProject(rootDir: string): Promise<ProjectIdentity | undefined> {
  await assertInitialized(rootDir);
  const paths = getHandoffPaths(rootDir);

  const data = await readJsonFile(paths.project);
  if (data === undefined) return undefined;

  try {
    return parseProject(data);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${paths.project}: ${reason}`, { cause: error });
  }
}

/** Creates or updates the identity. Nothing is written if the values are the same. */
export async function saveProject(
  rootDir: string,
  input: ProjectInput,
  now = new Date(),
): Promise<SaveProjectResult> {
  const existing = await readProject(rootDir);
  const project = buildProject(input, now, existing);

  if (
    existing?.name === project.name &&
    existing.description === project.description &&
    isSameTechnology(existing.technology, project.technology)
  ) {
    return { project: existing, status: 'unchanged' };
  }

  await writeJsonFile(getHandoffPaths(rootDir).project, project);
  return { project, status: existing ? 'updated' : 'created' };
}
