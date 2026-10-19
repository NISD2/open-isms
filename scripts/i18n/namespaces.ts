/**
 * Where the message files are and which translatable units they form, for every i18n script.
 * One listing, so the translator and the validator never disagree on what a namespace is.
 */

import { access, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SOURCE_LOCALE } from "./plan";

export const MESSAGES_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../messages",
);

const exists = (path: string): Promise<boolean> =>
  access(path).then(
    () => true,
    () => false,
  );

/**
 * Every translatable unit: a namespace directory holding `<locale>.json`, or, for a namespace
 * stored in parts (messages/requirements/<part>/<locale>.json), each part as `<namespace>/<part>`.
 */
export async function listNamespaces(): Promise<string[]> {
  const entries = await readdir(MESSAGES_DIR, { withFileTypes: true });
  const units = await Promise.all(
    entries
      .filter((e) => e.isDirectory())
      .map(async (e): Promise<string[]> => {
        if (await exists(resolve(MESSAGES_DIR, e.name, `${SOURCE_LOCALE}.json`))) {
          return [e.name];
        }
        const parts = await readdir(resolve(MESSAGES_DIR, e.name), {
          withFileTypes: true,
        });
        return parts.filter((p) => p.isDirectory()).map((p) => `${e.name}/${p.name}`);
      }),
  );
  return units.flat().sort();
}
