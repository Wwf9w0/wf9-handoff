import { describe, expect, it } from 'vitest';

import {
  isSameTechnology,
  parseTechnology,
  type Technology,
  unknownTechnology,
} from '../../src/core/technology.js';

const TECHNOLOGY: Technology = {
  language: 'typescript',
  runtime: 'node',
  packageManager: 'pnpm',
  framework: null,
  testFramework: 'vitest',
};

describe('parseTechnology', () => {
  it('accepts strings and nulls and drops unknown fields', () => {
    expect(parseTechnology({ ...TECHNOLOGY, extra: true })).toEqual(TECHNOLOGY);
  });

  it.each([null, [], 'typescript'])('rejects non-objects: %o', (data) => {
    expect(() => parseTechnology(data)).toThrow('"technology" must be an object');
  });

  it('allows null only where "none" makes sense', () => {
    expect(() => parseTechnology({ ...TECHNOLOGY, language: null })).toThrow(
      '"technology.language" must be a string',
    );
    expect(() => parseTechnology({ ...TECHNOLOGY, framework: 3 })).toThrow(
      '"technology.framework" must be a string or null',
    );
  });
});

describe('isSameTechnology', () => {
  it('compares every field', () => {
    expect(isSameTechnology(TECHNOLOGY, { ...TECHNOLOGY })).toBe(true);
    expect(isSameTechnology(TECHNOLOGY, { ...TECHNOLOGY, framework: 'unknown' })).toBe(false);
  });

  it('treats a missing technology as different from an unknown one', () => {
    expect(isSameTechnology(undefined, undefined)).toBe(true);
    expect(isSameTechnology(undefined, unknownTechnology())).toBe(false);
  });
});
