import { type Technology, unknownTechnology } from '../core/technology.js';
import { cargoEcosystem } from './cargo.js';
import type { Ecosystem } from './ecosystem.js';
import { readProjectFile } from './files.js';
import { goEcosystem } from './go.js';
import { mavenEcosystem } from './maven.js';
import { nodeEcosystem } from './node.js';
import { pubEcosystem } from './pub.js';

const ECOSYSTEMS: readonly Ecosystem[] = [
  nodeEcosystem,
  mavenEcosystem,
  pubEcosystem,
  cargoEcosystem,
  goEcosystem,
];

/** The files the scanner recognizes a project by. */
export const KNOWN_MANIFESTS = ECOSYSTEMS.map((ecosystem) => ecosystem.manifest);

export interface TechnologyScan {
  technology: Technology;
  /** Manifests found in the project root, e.g. ["package.json"]. */
  manifests: string[];
  /** Every file the result is based on, manifests first. */
  sources: string[];
}

/**
 * Detects the technology stack from files in the project root. Only reads
 * files; anything the files do not settle is reported as unknown.
 */
export async function scanTechnology(root: string): Promise<TechnologyScan> {
  const scans = await Promise.all(
    ECOSYSTEMS.map(async (ecosystem) => {
      const manifest = await readProjectFile(root, ecosystem.manifest);
      if (manifest === undefined) return undefined;

      const scan = await ecosystem.scan(manifest, root);
      return { ...scan, manifest: ecosystem.manifest };
    }),
  );
  const found = scans.filter((scan) => scan !== undefined);
  const manifests = found.map((scan) => scan.manifest);
  const sources = found.flatMap((scan) => [scan.manifest, ...(scan.otherSources ?? [])]);

  const [only, ...others] = found;
  if (only !== undefined && others.length === 0) {
    return { technology: only.technology, manifests, sources };
  }
  // No known project, or several side by side (e.g. package.json next to
  // go.mod). Mixed projects are not modelled yet, and picking one would be a guess.
  return { technology: unknownTechnology(), manifests, sources };
}
