import { Command } from 'commander';

import { registerInitCommand } from './commands/init.js';
import { registerProjectCommand } from './commands/project.js';
import { readVersion } from './version.js';

/**
 * Builds the CLI program without running it, so tests can drive it in-process.
 */
export function createProgram(): Command {
  const program = new Command()
    .name('wf9')
    .description('Switch AI agents without restarting the work.')
    .version(readVersion(), '-v, --version', 'output the current version')
    .helpOption('-h, --help', 'display help for command');

  registerInitCommand(program);
  registerProjectCommand(program);

  return program;
}
