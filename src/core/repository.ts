/** Version of the .handoff/repository.json format. */
export const REPOSITORY_SCHEMA_VERSION = '1.0';

export interface Commit {
  hash: string;
  subject: string;
  author: string;
  /** Author date, ISO 8601 with the author's UTC offset. */
  date: string;
}

/** How a file in the index differs from HEAD. */
export type StagedStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'type-changed';

export interface StagedChange {
  path: string;
  status: StagedStatus;
  /** The original path of a rename or copy. */
  from?: string;
}

export interface Rename {
  from: string;
  to: string;
}

/**
 * Uncommitted changes. Paths are relative to the Git root.
 *
 * `modified`, `deleted` and `renamed` say how the working tree differs from
 * HEAD, whether staged or not; `staged` says which changes are in the index.
 */
export interface RepositoryChanges {
  staged: StagedChange[];
  modified: string[];
  deleted: string[];
  renamed: Rename[];
  untracked: string[];
  /** Files with unresolved merge conflicts. */
  conflicted: string[];
}

/**
 * What Git reports about the repository at `capturedAt`. It is the source of
 * truth: it is only ever written from Git's output, never from what an agent
 * or a person says, and each capture replaces the previous one completely.
 */
export interface RepositoryState {
  schemaVersion: string;
  /** Git root relative to the project root; "." when they are the same directory. */
  root: string;
  /** `null` when HEAD is detached. */
  branch: string | null;
  /** `null` before the first commit. */
  head: Commit | null;
  /** Newest first; starts with `head`. */
  recentCommits: Commit[];
  changes: RepositoryChanges;
  capturedAt: string;
}

export function hasChanges(changes: RepositoryChanges): boolean {
  return Object.values(changes).some((list: unknown[]) => list.length > 0);
}
