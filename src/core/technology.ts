import { isRecord, readNullableString, readString } from './validate.js';

/** Stored when the project files do not settle a fact. Handoff never guesses. */
export const UNKNOWN = 'unknown';

/**
 * The project's technical stack, as observed in its files.
 *
 * Values are lowercase ids such as "typescript" or "pnpm", or `UNKNOWN`.
 * `null` means the files were read and show there is none, e.g. no framework.
 */
export interface Technology {
  language: string;
  /** `null` for languages compiled to native code, such as Rust and Go. */
  runtime: string | null;
  packageManager: string;
  framework: string | null;
  testFramework: string | null;
}

const TECHNOLOGY_FIELDS = [
  'language',
  'runtime',
  'packageManager',
  'framework',
  'testFramework',
] as const satisfies readonly (keyof Technology)[];

export function unknownTechnology(): Technology {
  return {
    language: UNKNOWN,
    runtime: UNKNOWN,
    packageManager: UNKNOWN,
    framework: UNKNOWN,
    testFramework: UNKNOWN,
  };
}

export function isSameTechnology(a: Technology | undefined, b: Technology | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  return TECHNOLOGY_FIELDS.every((field) => a[field] === b[field]);
}

/** Checks that parsed JSON has the shape of a Technology. */
export function parseTechnology(data: unknown): Technology {
  if (!isRecord(data)) throw new Error('"technology" must be an object');

  const prefix = 'technology.';
  return {
    language: readString(data, 'language', prefix),
    runtime: readNullableString(data, 'runtime', prefix),
    packageManager: readString(data, 'packageManager', prefix),
    framework: readNullableString(data, 'framework', prefix),
    testFramework: readNullableString(data, 'testFramework', prefix),
  };
}
