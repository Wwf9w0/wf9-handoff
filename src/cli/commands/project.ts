import { basename } from 'node:path';

import type { Command } from 'commander';

import type { ProjectIdentity, ProjectInput } from '../../core/project.js';
import { PROJECT_FILE_NAME } from '../../storage/paths.js';
import { requireProjectRoot } from '../../storage/project-root.js';
import { readProject, saveProject, type SaveStatus } from '../../storage/project.js';
import { createPrompter } from '../prompt.js';

interface SetupOptions {
  name?: string;
  description?: string;
}

const STATUS_MESSAGES: Record<SaveStatus, string> = {
  created: `✓ ${PROJECT_FILE_NAME} created`,
  updated: `✓ ${PROJECT_FILE_NAME} updated`,
  unchanged: 'Project identity is unchanged.',
};

export function registerProjectCommand(program: Command): void {
  const project = program.command('project').description('manage the project identity');

  project
    .command('setup')
    .description('set the project name and description')
    .option('-n, --name <name>', 'project name')
    .option('-d, --description <text>', 'what the project is for, in one sentence')
    .action(async (options: SetupOptions) => {
      const root = await requireProjectRoot(process.cwd());
      const existing = await readProject(root);
      const input = await collectInput(options, existing, basename(root));
      const result = await saveProject(root, input);

      console.log(`${STATUS_MESSAGES[result.status]}\n\n${formatProject(result.project)}`);
    });

  project
    .command('show')
    .description('show the project identity')
    .action(async () => {
      const identity = await readProject(await requireProjectRoot(process.cwd()));
      if (!identity) {
        throw new Error('No project identity yet. Run "wf9 project setup" first.');
      }

      console.log(formatProject(identity));
    });
}

/**
 * Options always win. Missing values are asked for in a terminal; otherwise
 * (e.g. when an agent runs the command) they fall back to the saved values.
 */
async function collectInput(
  options: SetupOptions,
  existing: ProjectIdentity | undefined,
  defaultName: string,
): Promise<ProjectInput> {
  if (!process.stdin.isTTY) {
    const name = options.name ?? existing?.name;
    const description = options.description ?? existing?.description;
    if (name === undefined || description === undefined) {
      const missing: string[] = [];
      if (name === undefined) missing.push('--name');
      if (description === undefined) missing.push('--description');
      throw new Error(
        `Missing ${missing.join(' and ')}. Pass them as options, or run in a terminal to be prompted.`,
      );
    }
    return { name, description };
  }

  if (options.name !== undefined && options.description !== undefined) {
    return { name: options.name, description: options.description };
  }

  const prompter = createPrompter({ input: process.stdin, output: process.stdout });
  try {
    return {
      name: options.name ?? (await prompter.ask('Project name', existing?.name ?? defaultName)),
      description:
        options.description ??
        (await prompter.ask('What is this project for?', existing?.description)),
    };
  } finally {
    prompter.close();
  }
}

function formatProject(project: ProjectIdentity): string {
  return [
    `Name:        ${project.name}`,
    `Description: ${project.description}`,
    `Root:        ${project.root}`,
    `Created:     ${project.createdAt}`,
    `Updated:     ${project.updatedAt}`,
  ].join('\n');
}
