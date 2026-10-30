import type { CategoryCode } from "@/lib/compliance/category-schemas";
import type { Item } from "./types";

/** One item of the NIS 2 script, typed by its category so its fields are the category's. */
export const item = <C extends CategoryCode>(i: Item<C>): Item<C> => i;

/** The § 30 measures: BSIG § 30 for German readers, Art. 21 NIS 2 for everyone else. */
export const MEASURES = { act: "nis2", bsig: 30, article: 21 } as const;
/** Management's duties: BSIG § 38, Art. 20 NIS 2. */
export const MANAGEMENT = { act: "nis2", bsig: 38, article: 20 } as const;
/** Registration: BSIG § 33, Art. 3 NIS 2. */
export const REGISTRATION = { act: "nis2", bsig: 33, article: 3 } as const;
