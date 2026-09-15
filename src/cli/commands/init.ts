import type { Command } from 'commander';

import { CONFIG_FILE_NAME, HANDOFF_DIR_NAME } from '../../storage/paths.js';
import { initHandoff, type InitResult } from '../../storage/init.js';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('initialize Handoff in the current directory')
    .action(async () => {
      const result = await initHandoff(process.cwd());
      console.log(formatInitResult(result));
    });
}

function formatInitResult(result: InitResult): string {
  switch (result.status) {
    case 'already-initialized':
      return 'Handoff is already initialized.';

    case 'inside-project':
      return `Handoff is already initialized in a parent directory: ${result.root}`;

    case 'initialized': {
      const lines: string[] = [];
      if (result.createdDir) lines.push(`✓ ${HANDOFF_DIR_NAME} directory created`);
      if (result.createdConfig) lines.push(`✓ ${CONFIG_FILE_NAME} created`);
      lines.push('', 'Handoff initialized.');
      return lines.join('\n');
    }
  }
}
