import { describe, expect, it } from 'vitest';

import { parseStatus } from '../../src/git/status.js';

const HASH = 'a'.repeat(40);

/** Builds `git status --porcelain=v2 --branch -z` output from its records. */
const output = (...records: string[]): string => `${records.join('\0')}\0`;
const changed = (xy: string, path: string): string =>
  `1 ${xy} N... 100644 100644 100644 ${HASH} ${HASH} ${path}`;
const renamed = (xy: string, path: string, from: string): string =>
  `2 ${xy} N... 100644 100644 100644 ${HASH} ${HASH} R100 ${path}\0${from}`;
const branchHeaders = (head: string, oid = HASH): string[] => [
  `# branch.oid ${oid}`,
  `# branch.head ${head}`,
];

describe('parseStatus', () => {
  it('reads the branch and HEAD commit', () => {
    expect(parseStatus(output(...branchHeaders('main')))).toMatchObject({
      branch: 'main',
      headHash: HASH,
    });
  });

  it('reports a detached HEAD as a null branch', () => {
    expect(parseStatus(output(...branchHeaders('(detached)'))).branch).toBeNull();
  });

  it('reports no HEAD commit before the first commit', () => {
    const status = parseStatus(output(...branchHeaders('main', '(initial)')));

    expect(status).toMatchObject({ branch: 'main', headHash: null });
  });

  it('sorts each change into its lists', () => {
    const status = parseStatus(
      output(
        ...branchHeaders('main'),
        changed('.M', 'edited.ts'),
        changed('M.', 'staged.ts'),
        changed('MM', 'both.ts'),
        changed('A.', 'new.ts'),
        changed('.D', 'gone.ts'),
        changed('D.', 'removed.ts'),
        changed('.T', 'link'),
        renamed('R.', 'after.ts', 'before.ts'),
        renamed('RM', 'moved.ts', 'original.ts'),
        '? notes.txt',
      ),
    );

    expect(status.changes).toEqual({
      staged: [
        { path: 'staged.ts', status: 'modified' },
        { path: 'both.ts', status: 'modified' },
        { path: 'new.ts', status: 'added' },
        { path: 'removed.ts', status: 'deleted' },
        { path: 'after.ts', status: 'renamed', from: 'before.ts' },
        { path: 'moved.ts', status: 'renamed', from: 'original.ts' },
      ],
      modified: ['edited.ts', 'staged.ts', 'both.ts', 'link', 'moved.ts'],
      deleted: ['gone.ts', 'removed.ts'],
      renamed: [
        { from: 'before.ts', to: 'after.ts' },
        { from: 'original.ts', to: 'moved.ts' },
      ],
      untracked: ['notes.txt'],
      conflicted: [],
    });
  });

  it('keeps spaces and special characters in paths', () => {
    const status = parseStatus(
      output(changed('.M', 'my notes/to do.md'), '? dir with space/', '? "quoted" ü.txt'),
    );

    expect(status.changes.modified).toEqual(['my notes/to do.md']);
    expect(status.changes.untracked).toEqual(['dir with space/', '"quoted" ü.txt']);
  });

  it('lists unmerged files as conflicted', () => {
    const status = parseStatus(
      output(`u UU N... 100644 100644 100644 100644 ${HASH} ${HASH} ${HASH} merge me.ts`),
    );

    expect(status.changes.conflicted).toEqual(['merge me.ts']);
  });

  it('does not call a new file that was deleted again a deletion', () => {
    const status = parseStatus(output(changed('AD', 'short-lived.ts')));

    expect(status.changes.staged).toEqual([{ path: 'short-lived.ts', status: 'added' }]);
    expect(status.changes.deleted).toEqual([]);
  });

  it('lists intent-to-add files as untracked', () => {
    const status = parseStatus(output(changed('.A', 'planned.ts')));

    expect(status.changes.untracked).toEqual(['planned.ts']);
    expect(status.changes.staged).toEqual([]);
  });

  it('rejects a status code it does not understand', () => {
    expect(() => parseStatus(output(changed('X.', 'odd.ts')))).toThrow(
      'Unexpected git status code "X."',
    );
  });

  it('handles empty output', () => {
    expect(parseStatus('').changes.untracked).toEqual([]);
  });
});
