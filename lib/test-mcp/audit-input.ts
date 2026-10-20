/**
 * What a read's audit row keeps of the tool input. The row has no company and so outlives any
 * customer's erasure; a name, an address or a search text typed into a tool must not be in it.
 * An allow-list by type: numbers, booleans, ids (uuid), calendar days and the two fixed `via`
 * words are kept as sent; any other string is kept only as its length, under `<key>Length`.
 * Pure.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const FIXED_WORDS: ReadonlySet<string> = new Set(["assistant", "app"]);

export type AuditedInput = Readonly<Record<string, string | number | boolean>>;

export function auditableInput(input: object): AuditedInput {
  return Object.fromEntries(
    Object.entries(input).flatMap(
      ([key, value]): Array<[string, string | number | boolean]> => {
        if (typeof value === "number" || typeof value === "boolean")
          return [[key, value]];
        if (typeof value !== "string") return [];
        return UUID.test(value) || DAY.test(value) || FIXED_WORDS.has(value)
          ? [[key, value]]
          : [[`${key}Length`, value.length]];
      },
    ),
  );
}
