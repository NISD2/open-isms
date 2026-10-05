"use client";

import { useEffect, useState } from "react";
import { bookerFrameUrl } from "@/lib/booking";

interface CalBookerProps {
  calLink: string;
  title: string;
}

/**
 * cal.com's booking page in a plain frame, so no cal.com script runs on our origin. The campaign
 * tags are read from the address bar after mount, so the frame loads once with them and the
 * server-rendered page is the same for everyone.
 */
export function CalBooker({ calLink, title }: CalBookerProps) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => setSrc(bookerFrameUrl(window.location.search, calLink)), [calLink]);

  return (
    <div className="h-[44rem] w-full">
      {src && <iframe src={src} title={title} className="size-full border-0" />}
    </div>
  );
}
