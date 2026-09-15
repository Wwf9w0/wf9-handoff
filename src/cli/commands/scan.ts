import type { Command } from 'commander';

import { KNOWN_MANIFESTS, scanTechnology, type TechnologyScan } from '../../scanner/technology.js';
import { PROJECT_FILE_NAME } from '../../storage/paths.js';
import { requireProjectRoot } from '../../storage/project-root.js';
import { readProject, saveProject, type SaveStatus } from '../../storage/project.js';
import { formatTechnology } from '../format.js';

const STATUS_MESSAGES: Record<SaveStatus, string> = {
  created: `✓ ${PROJECT_FILE_NAME} created`,
  updated: `✓ Technology saved to ${PROJECT_FILE_NAME}`,
  unchanged: 'Technology is unchanged.',
};

export function registerScanCommand(program: Command): void {
  program
    .command('scan')
    .description('detect the technology stack and save it to project.json')
    .action(async () => {
      const root = await requireProjectRoot(process.cwd());
      const existing = await readProject(root);
      if (!existing) {
        throw new Error('No project identity yet. Run "wf9 project setup" first.');
      }

      const scan = await scanTechnology(root);
      const result = await saveProject(root, {
        name: existing.name,
        description: existing.description,
        technology: scan.technology,
      });

      console.log(
        [
          STATUS_MESSAGES[result.status],
          formatTechnology(scan.technology),
          formatSources(scan),
        ].join('\n\n'),
      );
    });
}

function formatSources({ manifests, sources }: TechnologyScan): string {
  if (manifests.length === 0) {
    return `No project files found (looked for ${KNOWN_MANIFESTS.join(', ')}).`;
  }
  if (manifests.length > 1) {
    return `Found several kinds of project (${manifests.join(', ')}). Mixed projects are not supported yet, so everything is unknown.`;
  }
  return `Detected from: ${sources.join(', ')}`;
}
