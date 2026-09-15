/**
 * Version of the .handoff/config.json format (not the CLI version).
 * Bump it when the file's shape changes so older data can be migrated.
 */
export const CONFIG_SCHEMA_VERSION = '1.0';

export interface HandoffConfig {
  schemaVersion: string;
  createdAt: string;
}

export function createConfig(now: Date): HandoffConfig {
  return {
    schemaVersion: CONFIG_SCHEMA_VERSION,
    createdAt: now.toISOString(),
  };
}
