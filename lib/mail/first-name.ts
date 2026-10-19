/**
 * First token of the display name, but only when it reads as a name.
 * Registration defaults `name` to the email local part ("j.mueller",
 * "info42"), which would make an awkward greeting — those fall back to the
 * bare greeting. Lower-cased real names ("simon") get their initial raised.
 */
const NAME_PATTERN = /^\p{L}[\p{L}' -]*$/u;

export function displayableFirstName(name: string | null): string | null {
  const first = name?.trim().split(/\s+/)[0] ?? "";
  if (!first || first.length > 40 || !NAME_PATTERN.test(first)) return null;
  return first.charAt(0).toUpperCase() + first.slice(1);
}
