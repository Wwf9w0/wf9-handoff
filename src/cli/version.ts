import { readFileSync } from 'node:fs';

interface PackageJson {
  version: string;
}

/**
 * Reads the version from package.json at runtime so it is defined in one place.
 *
 * The relative path resolves to the project root both from `src/cli/` (tests)
 * and from `dist/cli/` (built CLI), since both are two levels deep.
 */
export function readVersion(): string {
  const packageJsonUrl = new URL('../../package.json', import.meta.url);
  const packageJson = JSON.parse(readFileSync(packageJsonUrl, 'utf8')) as PackageJson;
  return packageJson.version;
}
