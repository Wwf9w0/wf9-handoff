/** Version of the .handoff/project.json format. */
export const PROJECT_SCHEMA_VERSION = '1.0';

/** What the project is and why it exists, in words an agent can act on. */
export interface ProjectIdentity {
  schemaVersion: string;
  name: string;
  description: string;
  /** Project root relative to the directory containing `.handoff/`; always "." for now. */
  root: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  name: string;
  description: string;
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

  const timestamp = now.toISOString();
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    name,
    description,
    root: existing?.root ?? '.',
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

/** Checks that parsed JSON has the shape of a ProjectIdentity. */
export function parseProject(data: unknown): ProjectIdentity {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('expected a JSON object');
  }
  const record = data as Record<string, unknown>;

  return {
    schemaVersion: readString(record, 'schemaVersion'),
    name: readString(record, 'name'),
    description: readString(record, 'description'),
    root: readString(record, 'root'),
    createdAt: readString(record, 'createdAt'),
    updatedAt: readString(record, 'updatedAt'),
  };
}

function readString(record: Record<string, unknown>, field: string): string {
  const value = record[field];
  if (typeof value !== 'string') throw new Error(`"${field}" must be a string`);
  return value;
}
