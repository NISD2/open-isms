"use client";

import { type ComponentProps, useEffect, useState } from "react";
import { BOOKING_URL, bookingUrlFor } from "@/lib/booking";

/**
 * A link to the booking page that hands on the page's own campaign tags. They are read from the
 * address bar after mount and stored nowhere, so a booking keeps the campaign it came from and
 * the server-rendered page stays the same for everyone.
 */
export function BookingLink(props: Omit<ComponentProps<"a">, "href" | "target" | "rel">) {
  const [href, setHref] = useState(BOOKING_URL);
  useEffect(() => setHref(bookingUrlFor(window.location.search)), []);
  return <a {...props} href={href} target="_blank" rel="noopener noreferrer" />;
}
