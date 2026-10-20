import { TRPCError } from "@trpc/server";
import { DURCHGANG_MESSAGES } from "@/i18n/durchgang";
import {
  type AnyItem,
  type AnyScreen,
  itemOf,
  resolveItem,
  type ScreenKind,
  type Walk,
  type WalkLocale,
  walkLocaleOf,
} from "@/lib/durchgang";

/** The walk's message namespace per language, as every walk procedure reads it. */
export const NAMESPACES = {
  de: DURCHGANG_MESSAGES.de.durchgang,
  en: DURCHGANG_MESSAGES.en.durchgang,
  cs: DURCHGANG_MESSAGES.cs.durchgang,
} as const;

/** An item of any walk by its code; a code no walk has is the caller's mistake. */
export const walkItem = (code: string): AnyItem => {
  const item = itemOf(code);
  if (!item) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${code} is not in the Durchgang.`,
    });
  }
  return item;
};

/**
 * Refuses a write the item's screens do not ask for: a screen of `kind` is what lets the item
 * record it. `refusal` completes the message, as in "records no agreements".
 */
export const askedOnScreen = (code: string, kind: ScreenKind, refusal: string): void => {
  const screens: readonly AnyScreen[] = walkItem(code).screens;
  if (!screens.some((s) => s.kind === kind)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `${code} ${refusal}.` });
  }
};

/**
 * The language a walk's words and documents are written in for a record language: the company's
 * own where the walk is written in it, else English.
 */
export const recordLocaleOf = (walk: Walk, locale: WalkLocale): WalkLocale =>
  walkLocaleOf(locale, walk.locales);

/** An item's headline in `locale`, or its code while its words do not resolve. */
export const headlineOf = (code: string, locale: WalkLocale): string => {
  const words = resolveItem(NAMESPACES[locale], walkItem(code));
  return words.ok ? words.value.headline : code;
};
