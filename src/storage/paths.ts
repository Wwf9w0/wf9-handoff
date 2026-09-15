import { join, resolve } from 'node:path';

export const HANDOFF_DIR_NAME = '.handoff';
export const CONFIG_FILE_NAME = 'config.json';
export const PROJECT_FILE_NAME = 'project.json';

export interface HandoffPaths {
  /** Absolute path of the project root. */
  root: string;
  /** Absolute path of `<root>/.handoff`. */
  dir: string;
  /** Absolute path of `<root>/.handoff/config.json`. */
  config: string;
  /** Absolute path of `<root>/.handoff/project.json`. */
  project: string;
}

export function getHandoffPaths(rootDir: string): HandoffPaths {
  const root = resolve(rootDir);
  const dir = join(root, HANDOFF_DIR_NAME);

  return {
    root,
    dir,
    config: join(dir, CONFIG_FILE_NAME),
    project: join(dir, PROJECT_FILE_NAME),
  };
}
