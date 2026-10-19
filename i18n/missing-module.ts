/**
 * Whether a dynamic import of a message file failed because the file does not exist, in the words
 * webpack, Turbopack and Bun use. A missing file falls back to English; any other failure, such as
 * malformed JSON, is a real error and must surface. Bun reports a missing file as a ResolveMessage,
 * which is not an Error, so the message is read from any object that has one.
 */
const messageOf = (error: unknown): string =>
  typeof error === "object" && error !== null && "message" in error
    ? String(error.message)
    : String(error);

export const isMissingModule = (error: unknown): boolean => {
  const message = messageOf(error).toLowerCase();
  return (
    message.includes("cannot find module") ||
    message.includes("module not found") ||
    message.includes("failed to resolve")
  );
};
