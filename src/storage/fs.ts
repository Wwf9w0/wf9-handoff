import { readFile, rename, writeFile } from 'node:fs/promises';

export function hasErrorCode(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}

export function toJson(data: unknown): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

/** Returns the parsed JSON, or `undefined` if the file does not exist. */
export async function readJsonFile(file: string): Promise<unknown> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if (hasErrorCode(error, 'ENOENT')) return undefined;
    throw error;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(`${file} is not valid JSON`, { cause: error });
  }
}

/**
 * Writes to a temporary file first, then renames it into place. A rename is
 * atomic, so a crash mid-write can never leave a half-written file behind.
 */
export async function writeJsonFile(file: string, data: unknown): Promise<void> {
  const tempFile = `${file}.${String(process.pid)}.tmp`;
  await writeFile(tempFile, toJson(data));
  await rename(tempFile, file);
}
