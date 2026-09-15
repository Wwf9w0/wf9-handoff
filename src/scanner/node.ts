import { UNKNOWN, type Technology } from '../core/technology.js';
import { isRecord } from '../core/validate.js';
import { type Candidate, type Ecosystem, pickCandidate } from './ecosystem.js';
import { findProjectFiles, readProjectFile } from './files.js';

const PACKAGE_MANAGERS: readonly Candidate[] = [
  { id: 'pnpm', signals: ['pnpm-lock.yaml'] },
  { id: 'npm', signals: ['package-lock.json', 'npm-shrinkwrap.json'] },
  { id: 'yarn', signals: ['yarn.lock'] },
  { id: 'bun', signals: ['bun.lock', 'bun.lockb'] },
];
const LOCKFILES = PACKAGE_MANAGERS.flatMap((manager) => manager.signals);

const FRAMEWORKS: readonly Candidate[] = [
  { id: 'nextjs', signals: ['next'], includes: ['react'] },
  { id: 'nuxt', signals: ['nuxt'], includes: ['vue'] },
  { id: 'sveltekit', signals: ['@sveltejs/kit'], includes: ['svelte'] },
  { id: 'astro', signals: ['astro'], includes: ['react', 'vue', 'svelte'] },
  { id: 'react-native', signals: ['react-native'], includes: ['react'] },
  { id: 'angular', signals: ['@angular/core'] },
  { id: 'react', signals: ['react'] },
  { id: 'vue', signals: ['vue'] },
  { id: 'svelte', signals: ['svelte'] },
  { id: 'nestjs', signals: ['@nestjs/core'], includes: ['express', 'fastify'] },
  { id: 'express', signals: ['express'] },
  { id: 'fastify', signals: ['fastify'] },
];

/** Frameworks that only run on Node.js, so they prove the runtime. */
const NODE_FRAMEWORKS: ReadonlySet<string> = new Set(['nestjs', 'express', 'fastify']);

/** Stands in for a script running `node --test`, next to the dependency names. */
const NODE_TEST_SIGNAL = 'node:test';
const NODE_TEST_SCRIPT = /\bnode\b[^&|;]*\s--test\b/;

/** Unit-test runners. End-to-end tools such as Playwright are not counted. */
const TEST_FRAMEWORKS: readonly Candidate[] = [
  { id: 'vitest', signals: ['vitest'] },
  { id: 'jest', signals: ['jest'] },
  { id: 'mocha', signals: ['mocha'] },
  { id: 'jasmine', signals: ['jasmine'] },
  { id: 'ava', signals: ['ava'] },
  { id: 'node:test', signals: [NODE_TEST_SIGNAL] },
];

export const nodeEcosystem: Ecosystem = {
  manifest: 'package.json',

  async scan(manifest, root) {
    const hasTsconfig = (await findProjectFiles(root, ['tsconfig.json'])).length > 0;
    const lockfiles = await findProjectFiles(root, LOCKFILES);
    const pnpmWorkspace = await readProjectFile(root, 'pnpm-workspace.yaml');

    return {
      technology: detect(parseObject(manifest), hasTsconfig, lockfiles, pnpmWorkspace),
      otherSources: [
        ...(hasTsconfig ? ['tsconfig.json'] : []),
        ...lockfiles,
        ...(pnpmWorkspace === undefined ? [] : ['pnpm-workspace.yaml']),
      ],
    };
  },
};

function detect(
  pkg: Record<string, unknown> | undefined,
  hasTsconfig: boolean,
  lockfiles: readonly string[],
  pnpmWorkspace: string | undefined,
): Technology {
  const packageManager = detectPackageManager(pkg, lockfiles);

  if (pkg === undefined) {
    // An unreadable package.json hides the dependencies; only file names count.
    return {
      language: hasTsconfig ? 'typescript' : UNKNOWN,
      runtime: UNKNOWN,
      packageManager,
      framework: UNKNOWN,
      testFramework: UNKNOWN,
    };
  }

  const signals = collectSignals(pkg);
  const hasSignal = (signal: string): boolean => signals.has(signal);
  // A workspace root mostly lists tooling; the apps and their frameworks live in the packages.
  const whenNone = isWorkspaceRoot(pkg, pnpmWorkspace) ? UNKNOWN : null;
  const framework = pickCandidate(FRAMEWORKS, hasSignal, whenNone);
  const testFramework = pickCandidate(TEST_FRAMEWORKS, hasSignal, whenNone);

  return {
    language: hasTsconfig || hasSignal('typescript') ? 'typescript' : 'javascript',
    runtime: runsOnNode(pkg, hasSignal, framework) ? 'node' : UNKNOWN,
    packageManager,
    framework,
    testFramework,
  };
}

function detectPackageManager(
  pkg: Record<string, unknown> | undefined,
  lockfiles: readonly string[],
): string {
  const declared = pkg?.['packageManager'];
  if (typeof declared === 'string') {
    // Corepack's "name@version" is an explicit choice, so it wins over lockfiles.
    const name = declared.split('@')[0] ?? '';
    return PACKAGE_MANAGERS.some((manager) => manager.id === name) ? name : UNKNOWN;
  }
  return pickCandidate(PACKAGE_MANAGERS, (file) => lockfiles.includes(file), UNKNOWN);
}

function runsOnNode(
  pkg: Record<string, unknown>,
  hasSignal: (signal: string) => boolean,
  framework: string | null,
): boolean {
  const engines = pkg['engines'];
  return (
    (isRecord(engines) && 'node' in engines) ||
    hasSignal('@types/node') ||
    hasSignal(NODE_TEST_SIGNAL) ||
    (framework !== null && NODE_FRAMEWORKS.has(framework))
  );
}

/** Dependency names, plus NODE_TEST_SIGNAL if a script runs Node's test runner. */
function collectSignals(pkg: Record<string, unknown>): Set<string> {
  const signals = new Set([...keysOf(pkg['dependencies']), ...keysOf(pkg['devDependencies'])]);

  const scripts = isRecord(pkg['scripts']) ? Object.values(pkg['scripts']) : [];
  if (scripts.some((script) => typeof script === 'string' && NODE_TEST_SCRIPT.test(script))) {
    signals.add(NODE_TEST_SIGNAL);
  }
  return signals;
}

function isWorkspaceRoot(pkg: Record<string, unknown>, pnpmWorkspace: string | undefined): boolean {
  // npm and yarn list workspaces in package.json. pnpm uses pnpm-workspace.yaml,
  // which can also hold only settings, so it counts only with a `packages:` list.
  const workspaces = pkg['workspaces'];
  return (
    Array.isArray(workspaces) ||
    isRecord(workspaces) ||
    (pnpmWorkspace !== undefined && /^packages:/m.test(pnpmWorkspace))
  );
}

function keysOf(value: unknown): string[] {
  return isRecord(value) ? Object.keys(value) : [];
}

function parseObject(text: string): Record<string, unknown> | undefined {
  try {
    const data = JSON.parse(text) as unknown;
    return isRecord(data) ? data : undefined;
  } catch {
    return undefined;
  }
}
