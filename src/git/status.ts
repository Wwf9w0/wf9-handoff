import type { RepositoryChanges, StagedStatus } from '../core/repository.js';

export interface GitStatus {
  /** `null` when HEAD is detached. */
  branch: string | null;
  /** `null` before the first commit. */
  headHash: string | null;
  changes: RepositoryChanges;
}

/** Arguments that make `git status` print what parseStatus reads. */
export const STATUS_ARGS = [
  'status',
  '--porcelain=v2', // stable, documented format meant for scripts
  '--branch', // adds the "# branch.*" header lines
  '-z', // NUL-separated, so paths are never quoted or escaped
  '--renames', // detect renames even if the user's config turns it off
  '--untracked-files=normal', // show untracked files even if the user's config hides them
] as const;

const STAGED_STATUSES: Readonly<Record<string, StagedStatus>> = {
  A: 'added',
  M: 'modified',
  D: 'deleted',
  R: 'renamed',
  C: 'copied',
  T: 'type-changed',
};

/** How many space-separated fields come before the path, per record type. */
const FIELDS_BEFORE_PATH: Readonly<Record<string, number>> = { '1': 8, '2': 9, u: 10 };

/**
 * Parses `git status --porcelain=v2 --branch -z`.
 * Format: https://git-scm.com/docs/git-status#_porcelain_format_version_2
 */
export function parseStatus(output: string): GitStatus {
  const status: GitStatus = {
    branch: null,
    headHash: null,
    changes: { staged: [], modified: [], deleted: [], renamed: [], untracked: [], conflicted: [] },
  };
  const records = output.split('\0');

  for (let i = 0; i < records.length; i++) {
    const record = records[i] ?? '';
    const type = record.charAt(0);

    if (type === '#') {
      readHeader(record, status);
    } else if (type === '?') {
      status.changes.untracked.push(record.slice(2));
    } else if (type === 'u') {
      status.changes.conflicted.push(splitRecord(record, type).path);
    } else if (type === '1' || type === '2') {
      const { xy, path } = splitRecord(record, type);
      // A rename or copy record is followed by one more record: the original path.
      const from = type === '2' ? (records[++i] ?? '') : undefined;
      addChange(status.changes, xy, path, from);
    }
    // Anything else (ignored files, the empty string after the last NUL) is skipped.
  }
  return status;
}

function readHeader(record: string, status: GitStatus): void {
  const [, key, value = ''] = /^# (\S+) (.*)$/.exec(record) ?? [];
  if (key === 'branch.oid' && value !== '(initial)') status.headHash = value;
  if (key === 'branch.head' && value !== '(detached)') status.branch = value;
}

/** Splits a record into its XY status code and its path, which may contain spaces. */
function splitRecord(record: string, type: string): { xy: string; path: string } {
  const fields = record.split(' ');
  const count = FIELDS_BEFORE_PATH[type] ?? 0;
  return { xy: fields[1] ?? '', path: fields.slice(count).join(' ') };
}

/** X is the index (staged) status, Y the working tree status; "." means unchanged. */
function addChange(
  changes: RepositoryChanges,
  xy: string,
  path: string,
  from: string | undefined,
): void {
  const [x = '.', y = '.'] = xy;

  if (x !== '.') {
    const stagedStatus = STAGED_STATUSES[x];
    if (stagedStatus === undefined) throw new Error(`Unexpected git status code "${xy}"`);
    changes.staged.push({ path, status: stagedStatus, ...(from === undefined ? {} : { from }) });
  }

  if (x === 'R' && from !== undefined) changes.renamed.push({ from, to: path });

  if (y === 'A') {
    // `git add --intent-to-add`: tracked by name, but nothing of it is in the index yet.
    changes.untracked.push(path);
  } else if (x === 'D' || (y === 'D' && x !== 'A')) {
    changes.deleted.push(path);
  } else if (x === 'M' || x === 'T' || y === 'M' || y === 'T') {
    changes.modified.push(path);
  }
  // Left out on purpose: a staged new file (A.) is new, not modified, and one
  // that was then deleted again (AD) never existed at HEAD.
}
