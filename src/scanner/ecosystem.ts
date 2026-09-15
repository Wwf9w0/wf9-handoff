import { UNKNOWN, type Technology } from '../core/technology.js';

/** One kind of project, recognized by a manifest file in the project root. */
export interface Ecosystem {
  /** The file whose presence marks this kind of project, e.g. "package.json". */
  manifest: string;
  /** Reads the stack from the manifest's contents, plus other root files if needed. */
  scan(manifest: string, root: string): EcosystemScan | Promise<EcosystemScan>;
}

export interface EcosystemScan {
  technology: Technology;
  /** Files the result is also based on, besides the manifest. */
  otherSources?: string[];
}

/** A value the scanner can report, and the evidence that proves it. */
export interface Candidate {
  id: string;
  /** Names found in project files: package names, module paths, file names... */
  signals: readonly string[];
  /** Ids this one builds on and replaces, e.g. Next.js includes React. */
  includes?: readonly string[];
}

/**
 * Picks the one candidate the project shows signals of. Finding none gives
 * `whenNone`; finding several unrelated ones gives "unknown", never a guess.
 */
export function pickCandidate<T extends string | null>(
  candidates: readonly Candidate[],
  hasSignal: (signal: string) => boolean,
  whenNone: T,
): string | T {
  const found = candidates.filter((candidate) => candidate.signals.some(hasSignal));
  const included = new Set(found.flatMap((candidate) => candidate.includes ?? []));
  const [only, ...others] = new Set(
    found.map((candidate) => candidate.id).filter((id) => !included.has(id)),
  );

  if (only === undefined) return whenNone;
  return others.length === 0 ? only : UNKNOWN;
}
