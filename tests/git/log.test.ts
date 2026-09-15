import { describe, expect, it } from 'vitest';

import { parseLog } from '../../src/git/log.js';

const record = (...fields: string[]): string => `${fields.join('\x1f')}\0`;

describe('parseLog', () => {
  it('reads commits newest first', () => {
    const output =
      record('b'.repeat(40), 'Ada Lovelace', '2027-01-02T10:00:00+03:00', 'feat: second') +
      record('a'.repeat(40), 'Ada Lovelace', '2027-01-01T10:00:00+03:00', 'feat: first');

    expect(parseLog(output)).toEqual([
      {
        hash: 'b'.repeat(40),
        subject: 'feat: second',
        author: 'Ada Lovelace',
        date: '2027-01-02T10:00:00+03:00',
      },
      {
        hash: 'a'.repeat(40),
        subject: 'feat: first',
        author: 'Ada Lovelace',
        date: '2027-01-01T10:00:00+03:00',
      },
    ]);
  });

  it('keeps the subject exactly as Git reports it', () => {
    const [commit] = parseLog(record('a'.repeat(40), 'Ada', '2027-01-01T10:00:00Z', ' fix: a | b'));

    expect(commit?.subject).toBe(' fix: a | b');
  });

  it('returns nothing for empty output', () => {
    expect(parseLog('')).toEqual([]);
  });
});
