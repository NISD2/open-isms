/**
 * Object-key and content-type hygiene for everything that gets a presigned PUT.
 *
 * Audit F-4 (2026-09-10). Four upload paths sign keys into the same bucket:
 * evidence, training certificates, supplier logos and supplier certifications.
 * Two of them sanitized the caller's filename and pinned the content type; two
 * spliced `input.fileName` straight into the key and passed `fileType` through
 * as whatever the client claimed. This module is the one copy, so they cannot
 * drift apart again.
 */

/**
 * Reduce a caller-supplied filename to the character set an object key can
 * carry without surprises. Anything outside `[A-Za-z0-9._-]` becomes `_`.
 *
 * What that guarantees, exactly: no path SEPARATORS. `.` is in the allowed
 * set, so `..` survives verbatim — `sanitizeFilename("../../etc/passwd")` is
 * `".._.._etc_passwd"`. Traversal is defeated because the slashes are gone,
 * not because the dots are. So this is safe for a whole filename and NOT
 * safe for a path segment that something later joins with "/". S3 treats
 * keys as opaque strings anyway, but the S3-compatible servers a self-hoster
 * may point at do not all agree on that, which is why the separators go.
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

/**
 * Content types an object may be STORED under as-is.
 *
 * Not a mirror of any uploader's `accept` list, and deliberately not a
 * validation allowlist — nothing is rejected for missing from this set, and
 * the row's own `fileType` column still records what the browser reported.
 * The only question here is what Content-Type the object carries in the
 * bucket, i.e. what a browser would be invited to do with the bytes if it
 * ever reached them directly. Formats a browser executes (text/html,
 * image/svg+xml, application/xhtml+xml) are absent on purpose and everything
 * unrecognised lands on the same safe default, so adding a format to an
 * uploader's `accept` without touching this set costs a less specific stored
 * type and nothing else.
 */
const STORABLE_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

/** What an unrecognised type becomes: bytes, and never a document a browser renders. */
const FALLBACK_CONTENT_TYPE = "application/octet-stream";

/**
 * Pin the content type an object is stored with.
 *
 * The stored type is what a presigned GET later serves, and the evidence list
 * opens that URL with `target="_blank"`. A caller who claimed `text/html` or
 * `image/svg+xml` therefore got a page rendered on the storage origin, which
 * under the bundled Caddy config is a sibling hostname of the app.
 *
 * Unrecognised types are downgraded rather than rejected. Rejecting would
 * break real uploads: browsers disagree about the type of a `.csv` and send an
 * empty string or `application/octet-stream` for anything the OS cannot place.
 * Downgrading keeps every upload the UI accepts working and still means no
 * caller can choose a type a browser will execute.
 */
export function normalizeContentType(contentType: string): string {
  const bare = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return STORABLE_CONTENT_TYPES.has(bare) ? bare : FALLBACK_CONTENT_TYPE;
}
