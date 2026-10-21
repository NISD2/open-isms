import { z } from "zod";

/** Who or what an id in a log entry turned out to be. */
export type NamedId = { readonly kind: "user" | "company"; readonly name: string };

const uuid = z.uuid();

/**
 * Every uuid a log entry mentions: the entity it is about and any id inside the values it
 * stored, at any depth. Ids are found by their shape, not by key name, so `userId`, a list of
 * ids and a nested `companyId` all count; the ones that name nobody are dropped later, when
 * they are looked up.
 */
export function idsIn(entityId: string | null, ...values: readonly unknown[]): string[] {
  const found = new Set<string>();
  const walk = (value: unknown): void => {
    if (typeof value === "string") {
      if (uuid.safeParse(value).success) found.add(value);
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value !== null && typeof value === "object") {
      Object.values(value).forEach(walk);
    }
  };
  if (entityId) walk(entityId);
  values.forEach(walk);
  return [...found];
}

/** A piece of text or an id, with where it starts in the text, which makes a stable key. */
export type Segment =
  | { readonly at: number; readonly text: string }
  | { readonly at: number; readonly id: string };

/**
 * Text cut at every quoted id in `ids`, so the id can be shown as a name where the text had the
 * quoted id. The text is the JSON of a stored value, so an id there always sits in quotes.
 */
export function segments(text: string, ids: readonly string[], offset = 0): Segment[] {
  const first = ids
    .map((id) => ({ id, at: text.indexOf(`"${id}"`) }))
    .filter((hit) => hit.at >= 0)
    .sort((a, b) => a.at - b.at)[0];
  if (!first) return text ? [{ at: offset, text }] : [];
  const after = first.at + first.id.length + 2;
  return [
    ...(first.at > 0 ? [{ at: offset, text: text.slice(0, first.at) }] : []),
    { at: offset + first.at, id: first.id },
    ...segments(text.slice(after), ids, offset + after),
  ];
}
