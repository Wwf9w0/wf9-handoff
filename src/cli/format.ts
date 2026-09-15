import type { Technology } from '../core/technology.js';

export function formatTechnology(technology: Technology): string {
  return [
    `Language:        ${technology.language}`,
    `Runtime:         ${orNone(technology.runtime)}`,
    `Package manager: ${technology.packageManager}`,
    `Framework:       ${orNone(technology.framework)}`,
    `Test framework:  ${orNone(technology.testFramework)}`,
  ].join('\n');
}

/** `null` means the project files show there is none. */
function orNone(value: string | null): string {
  return value ?? 'none';
}
