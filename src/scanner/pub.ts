import { type Candidate, type Ecosystem, pickCandidate } from './ecosystem.js';

/** Flutter apps depend on the SDK as `flutter: { sdk: flutter }`. */
const FRAMEWORKS: readonly Candidate[] = [{ id: 'flutter', signals: ['flutter'] }];

const TEST_FRAMEWORKS: readonly Candidate[] = [
  { id: 'flutter_test', signals: ['flutter_test'], includes: ['dart_test'] },
  { id: 'dart_test', signals: ['test'] },
];

export const pubEcosystem: Ecosystem = {
  manifest: 'pubspec.yaml',

  scan(manifest) {
    const packages = new Set([
      ...childKeys(manifest, 'dependencies'),
      ...childKeys(manifest, 'dev_dependencies'),
    ]);
    const hasSignal = (signal: string): boolean => packages.has(signal);

    return {
      technology: {
        language: 'dart',
        runtime: 'dart',
        packageManager: 'pub',
        framework: pickCandidate(FRAMEWORKS, hasSignal, null),
        testFramework: pickCandidate(TEST_FRAMEWORKS, hasSignal, null),
      },
    };
  },
};

/**
 * Keys directly under a top-level YAML mapping, e.g. the package names under
 * `dependencies:`. Enough for pubspec.yaml without pulling in a YAML parser.
 */
function childKeys(yaml: string, section: string): string[] {
  const keys: string[] = [];
  let inSection = false;
  let childIndent: number | undefined;

  for (const line of yaml.split(/\r?\n/)) {
    const content = line.trimStart();
    if (content === '' || content.startsWith('#')) continue;

    const indent = line.length - content.length;
    if (indent === 0) {
      inSection = content.startsWith(`${section}:`);
      childIndent = undefined;
      continue;
    }
    if (!inSection) continue;

    childIndent ??= indent;
    const key = /^([\w-]+)\s*:/.exec(content)?.[1];
    if (indent === childIndent && key !== undefined) keys.push(key);
  }
  return keys;
}
