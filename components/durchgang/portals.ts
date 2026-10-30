import type { Registration } from "./view";

export type Portal = Registration["portals"][number];

/**
 * The member states as the registration and reporting screens show them: each named in the
 * reader's language, sorted by that name, with the company's own country taken out to sit first
 * and large. `all` is the same list with it, for picking the country.
 */
export const splitPortals = (registration: Registration, locale: string) => {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const nameOf = (p: Portal) => names.of(p.countryCode) ?? p.countryCode;
  const all = registration.portals.toSorted((a, b) =>
    nameOf(a).localeCompare(nameOf(b), locale),
  );
  const own = all.find((p) => p.countryCode === registration.country) ?? null;
  return { own, others: all.filter((p) => p !== own), all, nameOf };
};
