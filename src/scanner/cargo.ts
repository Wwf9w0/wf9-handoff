import { UNKNOWN } from '../core/technology.js';
import { type Candidate, type Ecosystem, pickCandidate } from './ecosystem.js';

const FRAMEWORKS: readonly Candidate[] = [
  { id: 'actix-web', signals: ['actix-web'] },
  { id: 'axum', signals: ['axum'] },
  { id: 'rocket', signals: ['rocket'] },
  { id: 'tauri', signals: ['tauri'] },
];

export const cargoEcosystem: Ecosystem = {
  manifest: 'Cargo.toml',

  scan(manifest) {
    const { tables, dependencies } = readCargoToml(manifest);
    const hasSignal = (signal: string): boolean => dependencies.has(signal);
    // A virtual workspace has no package of its own; its members hold the dependencies.
    const isWorkspaceRoot = tables.has('workspace') && !tables.has('package');

    return {
      technology: {
        language: 'rust',
        runtime: null,
        packageManager: 'cargo',
        framework: pickCandidate(FRAMEWORKS, hasSignal, isWorkspaceRoot ? UNKNOWN : null),
        // Cargo's test harness is built in, so every Rust project has it.
        testFramework: 'cargo-test',
      },
    };
  },
};

/**
 * Collects table names and dependency names line by line. Enough for
 * Cargo.toml without pulling in a TOML parser.
 */
function readCargoToml(toml: string): { tables: Set<string>; dependencies: Set<string> } {
  const tables = new Set<string>();
  const dependencies = new Set<string>();
  let table = '';

  for (const line of toml.split(/\r?\n/)) {
    const content = line.trim();
    if (content === '' || content.startsWith('#')) continue;

    const header = /^\[\[?\s*([^\]]+?)\s*\]\]?\s*(?:#.*)?$/.exec(content)?.[1];
    if (header !== undefined) {
      table = header;
      tables.add(table);
      // [dependencies.serde] declares one dependency as its own table.
      const dotted = /^(?:.+\.)?(?:dev-|build-)?dependencies\.([\w-]+)$/.exec(table)?.[1];
      if (dotted !== undefined) dependencies.add(dotted);
      continue;
    }

    // Also matches [target.'cfg(unix)'.dependencies] and [workspace.dependencies].
    if (/(?:^|\.)(?:dev-|build-)?dependencies$/.test(table)) {
      const key = /^([\w-]+)\s*=/.exec(content)?.[1];
      if (key !== undefined) dependencies.add(key);
    }
  }
  return { tables, dependencies };
}
