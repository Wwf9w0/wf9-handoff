import { UNKNOWN } from '../core/technology.js';
import { type Candidate, type Ecosystem, pickCandidate } from './ecosystem.js';

/** Maven compiles Java unless a plugin for another JVM language is configured. */
const LANGUAGES: readonly Candidate[] = [
  { id: 'kotlin', signals: ['org.jetbrains.kotlin'] },
  { id: 'scala', signals: ['org.scala-lang', 'scala-maven-plugin'] },
];

const FRAMEWORKS: readonly Candidate[] = [
  { id: 'spring-boot', signals: ['org.springframework.boot'] },
  { id: 'quarkus', signals: ['io.quarkus'] },
  { id: 'micronaut', signals: ['io.micronaut'] },
];

const TEST_FRAMEWORKS: readonly Candidate[] = [
  // The framework test starters are how these projects pull in JUnit.
  {
    id: 'junit',
    signals: [
      'org.junit',
      'junit',
      'spring-boot-starter-test',
      'quarkus-junit5',
      'micronaut-test-junit5',
    ],
  },
  { id: 'testng', signals: ['org.testng'] },
];

export const mavenEcosystem: Ecosystem = {
  manifest: 'pom.xml',

  scan(manifest) {
    const pom = manifest.replace(/<!--[\s\S]*?-->/g, '');
    const ids = [...tagValues(pom, 'groupId'), ...tagValues(pom, 'artifactId')];
    // "org.junit" also matches group ids below it, such as "org.junit.jupiter".
    const hasSignal = (signal: string): boolean =>
      ids.some((id) => id === signal || id.startsWith(`${signal}.`));
    // A parent pom's dependencies are only part of the picture; its modules have the rest.
    const whenNone = /<modules>/.test(pom) ? UNKNOWN : null;

    return {
      technology: {
        language: pickCandidate(LANGUAGES, hasSignal, 'java'),
        runtime: 'jvm',
        packageManager: 'maven',
        framework: pickCandidate(FRAMEWORKS, hasSignal, whenNone),
        testFramework: pickCandidate(TEST_FRAMEWORKS, hasSignal, whenNone),
      },
    };
  },
};

function tagValues(xml: string, tag: string): string[] {
  const pattern = new RegExp(`<${tag}>\\s*([^<]*?)\\s*</${tag}>`, 'g');
  return [...xml.matchAll(pattern)].map((match) => match[1] ?? '');
}
