import { parseTechnology, type Technology } from './technology.js';
import { isRecord, readString } from './validate.js';

/**
 * Version of the .handoff/project.json format.
 * 1.1 added the optional `technology` field; 1.0 files are still read as is.
 */
export const PROJECT_SCHEMA_VERSION = '1.1';

/** What the project is and why it exists, in words an agent can act on. */
export interface ProjectIdentity {
  schemaVersion: string;
  name: string;
  description: string;
  /** Project root relative to the directory containing `.handoff/`; always "." for now. */
  root: string;
  /** Observed by the scanner; absent until the first scan. */
  technology?: Technology;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  name: string;
  description: string;
  /** Leave out to keep the existing technology. */
  technology?: Technology;
}

/**
 * Creates a new identity, or an updated copy of `existing` that keeps its
 * creation time.
 */
export function buildProject(
  input: ProjectInput,
  now: Date,
  existing?: ProjectIdentity,
): ProjectIdentity {
  const name = input.name.trim();
  const description = input.description.trim();
  if (name === '') throw new Error('Project name cannot be empty.');
  if (description === '') throw new Error('Project description cannot be empty.');

  const technology = input.technology ?? existing?.technology;
  const timestamp = now.toISOString();
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    name,
    description,
    root: existing?.root ?? '.',
    ...(technology === undefined ? {} : { technology }),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

/** Checks that parsed JSON has the shape of a ProjectIdentity. */
export function parseProject(data: unknown): ProjectIdentity {
  if (!isRecord(data)) throw new Error('expected a JSON object');
  const technology = data['technology'];

  return {
    schemaVersion: readString(data, 'schemaVersion'),
    name: readString(data, 'name'),
    description: readString(data, 'description'),
    root: readString(data, 'root'),
    ...(technology === undefined ? {} : { technology: parseTechnology(technology) }),
    createdAt: readString(data, 'createdAt'),
    updatedAt: readString(data, 'updatedAt'),
  };
}
