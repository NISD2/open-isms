/**
 * The description the automatic audit row carries when a call fails or is refused (init.ts), and
 * how the activity log reads it back. One place for the format, so the writer and the reader
 * cannot drift apart. No imports: the activity log runs in the browser.
 */

const SEPARATOR = " failed (";

/** "risk.update failed (FORBIDDEN)": the procedure's path and the tRPC error code. */
export const failedCallDescription = (path: string, code: string): string =>
  `${path}${SEPARATOR}${code})`;

/** The error code when a row's description is the failure of its own action, otherwise null. */
export function failedCallCode(action: string, description: string): string | null {
  const prefix = `${action}${SEPARATOR}`;
  if (!description.startsWith(prefix) || !description.endsWith(")")) return null;
  const code = description.slice(prefix.length, -1);
  return code.length > 0 ? code : null;
}
