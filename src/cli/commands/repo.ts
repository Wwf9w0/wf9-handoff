import type { Command } from 'commander';

import { type Commit, hasChanges, type RepositoryState } from '../../core/repository.js';
import { readRepositoryState } from '../../git/repository.js';
import { REPOSITORY_FILE_NAME } from '../../storage/paths.js';
import { requireProjectRoot } from '../../storage/project-root.js';
import { type RepositorySaveStatus, saveRepository } from '../../storage/repository.js';

/** Longer lists are cut short in the terminal; repository.json always has all of them. */
const MAX_LISTED = 20;

const STATUS_MESSAGES: Record<RepositorySaveStatus, string> = {
  created: `✓ ${REPOSITORY_FILE_NAME} created`,
  updated: `✓ ${REPOSITORY_FILE_NAME} updated`,
};

export function registerRepoCommand(program: Command): void {
  program
    .command('repo')
    .description('capture the Git repository state in repository.json')
    .action(async () => {
      const root = await requireProjectRoot(process.cwd());
      const state = await readRepositoryState(root);
      const status = await saveRepository(root, state);

      console.log(`${STATUS_MESSAGES[status]}\n\n${formatRepository(state)}`);
    });
}

function formatRepository(state: RepositoryState): string {
  const summary = [
    `Branch:   ${state.branch ?? '(detached HEAD)'}`,
    `HEAD:     ${state.head ? formatCommit(state.head) : '(no commits yet)'}`,
  ];
  if (state.root !== '.') summary.push(`Git root: ${state.root}`);

  const { staged, modified, deleted, renamed, untracked, conflicted } = state.changes;
  const sections = [
    summary.join('\n'),
    formatList(
      'Recent commits',
      state.recentCommits.map((commit) => `${commit.date.slice(0, 10)} ${formatCommit(commit)}`),
    ),
    formatList('Conflicted', conflicted),
    formatList(
      'Staged',
      staged.map(({ status, path, from }) =>
        `${status.padEnd(12)} ${from === undefined ? path : `${from} -> ${path}`}`.trimEnd(),
      ),
    ),
    formatList('Modified', modified),
    formatList('Deleted', deleted),
    formatList(
      'Renamed',
      renamed.map(({ from, to }) => `${from} -> ${to}`),
    ),
    formatList('Untracked', untracked),
  ];
  if (!hasChanges(state.changes)) sections.push('Working tree clean.');

  return sections.filter((section) => section !== '').join('\n\n');
}

function formatCommit(commit: Commit): string {
  return `${commit.hash.slice(0, 7)} ${commit.subject}`;
}

/** A titled, indented list, or '' when there is nothing to list. */
function formatList(title: string, items: readonly string[]): string {
  if (items.length === 0) return '';

  const lines = items.slice(0, MAX_LISTED).map((item) => `  ${item}`);
  const hidden = items.length - MAX_LISTED;
  if (hidden > 0) lines.push(`  ... and ${String(hidden)} more in ${REPOSITORY_FILE_NAME}`);

  return `${title} (${String(items.length)}):\n${lines.join('\n')}`;
}
