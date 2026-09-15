import { type Candidate, type Ecosystem, pickCandidate } from './ecosystem.js';

const FRAMEWORKS: readonly Candidate[] = [
  { id: 'gin', signals: ['github.com/gin-gonic/gin'] },
  { id: 'echo', signals: ['github.com/labstack/echo'] },
  { id: 'fiber', signals: ['github.com/gofiber/fiber'] },
  { id: 'chi', signals: ['github.com/go-chi/chi'] },
];

export const goEcosystem: Ecosystem = {
  manifest: 'go.mod',

  scan(manifest) {
    const modules = directRequirements(manifest);
    // Major versions are path suffixes: ".../echo/v4" is still echo.
    const hasSignal = (signal: string): boolean =>
      modules.some((module) => module === signal || module.startsWith(`${signal}/`));

    return {
      technology: {
        language: 'go',
        runtime: null,
        packageManager: 'go',
        framework: pickCandidate(FRAMEWORKS, hasSignal, null),
        // `go test` is built into the toolchain, so every Go project has it.
        testFramework: 'go-test',
      },
    };
  },
};

/** Module paths from `require` lines, skipping `// indirect` ones the project does not import. */
function directRequirements(goMod: string): string[] {
  const modules: string[] = [];
  let inBlock = false;

  for (const line of goMod.split(/\r?\n/)) {
    const content = line.trim();
    let requirement: string | undefined;

    if (inBlock) {
      if (content.startsWith(')')) {
        inBlock = false;
        continue;
      }
      requirement = content;
    } else if (/^require\s*\($/.test(content)) {
      inBlock = true;
      continue;
    } else {
      requirement = /^require\s+(.+)$/.exec(content)?.[1];
    }

    if (requirement === undefined || /\/\/\s*indirect\b/.test(requirement)) continue;
    const module = /^([^\s/]\S*)\s/.exec(requirement)?.[1];
    if (module !== undefined) modules.push(module);
  }
  return modules;
}
