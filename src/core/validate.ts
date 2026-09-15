/** Helpers for checking the shape of JSON read from disk. */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `prefix` names the parent object in errors, e.g. "technology." */
export function readString(record: Record<string, unknown>, field: string, prefix = ''): string {
  const value = record[field];
  if (typeof value !== 'string') throw new Error(`"${prefix}${field}" must be a string`);
  return value;
}

export function readNullableString(
  record: Record<string, unknown>,
  field: string,
  prefix = '',
): string | null {
  const value = record[field];
  if (value !== null && typeof value !== 'string') {
    throw new Error(`"${prefix}${field}" must be a string or null`);
  }
  return value;
}
