"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

interface CalBookerProps {
  calLink: string;
}

export function CalBooker({ calLink }: CalBookerProps) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "work" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  return (
    <Cal
      namespace="work"
      calLink={calLink}
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      config={{ layout: "month_view" }}
    />
  );
}
