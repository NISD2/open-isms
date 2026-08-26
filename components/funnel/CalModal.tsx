"use client";

import { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

interface CalModalProps {
  calLink: string;
  children: React.ReactNode;
}

export function CalModal({ calLink, children }: CalModalProps) {
  useEffect(() => {
    if (!calLink) return;

    (async function () {
      const cal = await getCalApi({ namespace: "work" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, [calLink]);

  if (!calLink) return null;

  return (
    <span
      data-cal-namespace="work"
      data-cal-link={calLink}
      data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
    >
      {children}
    </span>
  );
}
