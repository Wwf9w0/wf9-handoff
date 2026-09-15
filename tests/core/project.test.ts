import { describe, expect, it } from 'vitest';

import { buildProject, parseProject, type ProjectIdentity } from '../../src/core/project.js';

const NOW = new Date('2027-01-01T10:00:00Z');
const LATER = new Date('2027-02-01T10:00:00Z');

const EXISTING: ProjectIdentity = {
  schemaVersion: '1.0',
  name: 'handoff',
  description: 'Cross-agent project continuity tool',
  root: '.',
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString(),
};

describe('buildProject', () => {
  it('creates a new identity with trimmed values', () => {
    expect(buildProject({ name: ' handoff ', description: ' A tool \n' }, NOW)).toEqual({
      schemaVersion: '1.0',
      name: 'handoff',
      description: 'A tool',
      root: '.',
      createdAt: '2027-01-01T10:00:00.000Z',
      updatedAt: '2027-01-01T10:00:00.000Z',
    });
  });

  it('keeps createdAt and root when updating', () => {
    const updated = buildProject({ name: 'handoff', description: 'New' }, LATER, {
      ...EXISTING,
      root: 'app',
    });

    expect(updated.createdAt).toBe(EXISTING.createdAt);
    expect(updated.updatedAt).toBe(LATER.toISOString());
    expect(updated.root).toBe('app');
  });

  it.each([
    [{ name: '', description: 'A tool' }, 'Project name cannot be empty.'],
    [{ name: 'x', description: '   ' }, 'Project description cannot be empty.'],
  ])('rejects empty values: %o', (input, message) => {
    expect(() => buildProject(input, NOW)).toThrow(message);
  });
});

describe('parseProject', () => {
  it('accepts a valid identity and drops unknown fields', () => {
    expect(parseProject({ ...EXISTING, extra: true })).toEqual(EXISTING);
  });

  it.each([null, [], 'text', 42])('rejects non-objects: %o', (data) => {
    expect(() => parseProject(data)).toThrow('expected a JSON object');
  });

  it('names the first invalid field', () => {
    expect(() => parseProject({ ...EXISTING, name: 7 })).toThrow('"name" must be a string');
  });
});
