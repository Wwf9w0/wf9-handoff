import type { Commit } from '../core/repository.js';

/** Separates fields inside one commit; the ASCII "unit separator" never appears in them. */
const FIELD_SEPARATOR = '\x1f';

/** Arguments that make `git log` print the newest `limit` commits the way parseLog reads them. */
export function logArgs(limit: number): string[] {
  // -z ends each commit with NUL. %s is the subject: the first line of the message.
  return ['log', `--max-count=${String(limit)}`, '-z', '--format=%H%x1f%an%x1f%aI%x1f%s'];
}

export function parseLog(output: string): Commit[] {
  return output
    .split('\0')
    .filter((record) => record !== '')
    .map((record) => {
      const [hash = '', author = '', date = '', subject = ''] = record.split(FIELD_SEPARATOR);
      return { hash, subject, author, date };
    });
}
