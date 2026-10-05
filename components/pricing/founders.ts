/**
 * The two founders, with their photos: on the talk-first card, the booking dialog and the
 * approval page. `takesCalls`: hosts the call booked through BookingLink, so the talk-first card
 * and the booking dialog name only them.
 */
export const FOUNDERS = [
  {
    name: "Simon Orzel",
    firstName: "Simon",
    photo: "/images/people/simon.png",
    takesCalls: true,
  },
  {
    name: "Cory Hisey",
    firstName: "Cory",
    photo: "/images/people/cory.png",
    takesCalls: false,
  },
] as const;

export const CALL_HOSTS = FOUNDERS.filter((person) => person.takesCalls);

/** "Simon", or "Simon or Cory" once both take calls, in the reader's language. */
export function callHostNames(locale: string): string {
  return new Intl.ListFormat(locale, { type: "disjunction" }).format(
    CALL_HOSTS.map((person) => person.firstName),
  );
}
