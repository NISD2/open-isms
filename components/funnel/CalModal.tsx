"use client";

import { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export function CalModal({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "work" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  return (
    <span
      data-cal-namespace="work"
      data-cal-link="sorzel/work"
      data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
    >
      {children}
    </span>
  );
}
