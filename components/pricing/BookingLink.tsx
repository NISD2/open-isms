"use client";

import { type ComponentProps, type MouseEvent, useEffect, useState } from "react";
import { BOOKING_CAL_LINK, bookingUrlFor } from "@/lib/booking";
import { BookingDialog } from "./BookingDialog";

/** A click the browser should handle itself: another tab, another window, a download. */
function opensElsewhere(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
  );
}

/**
 * A link to the booking page that opens the booking calendar in a dialog over the page. The href
 * stays real, so a middle click, a new-tab click or a page without JavaScript still reaches
 * cal.com. It hands on the page's own campaign tags, read from the address bar after mount and
 * stored nowhere, so a booking keeps the campaign it came from and the server-rendered page stays
 * the same for everyone.
 */
export function BookingLink({
  calLink = BOOKING_CAL_LINK,
  onClick,
  ...props
}: Omit<ComponentProps<"a">, "href" | "target" | "rel"> & {
  /** A cal.com handle such as "nisd2/qc"; an instance's own CAL_LINK where it sets one. */
  calLink?: string;
}) {
  const [href, setHref] = useState(() => bookingUrlFor("", calLink));
  const [open, setOpen] = useState(false);
  useEffect(() => setHref(bookingUrlFor(window.location.search, calLink)), [calLink]);
  return (
    <>
      <a
        {...props}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented || opensElsewhere(event)) return;
          event.preventDefault();
          setOpen(true);
        }}
      />
      <BookingDialog calLink={calLink} href={href} open={open} onOpenChange={setOpen} />
    </>
  );
}
