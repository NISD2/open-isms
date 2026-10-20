"use client";

import { useTranslations } from "next-intl";
import type { ThroughSupplier } from "@/lib/durchgang";

/**
 * How the record words an activity's transfers through one supplier (Art. 30(1)(e)): the same
 * line on the walk's screen, the record page and its download.
 */
export function useThroughLine(): (name: string, through: ThroughSupplier) => string {
  const t = useTranslations("processingActivities.through");
  const basis = useTranslations("suppliers.transferMechanism");
  return (name, through) => {
    switch (through.kind) {
      case "outside":
        return t("outside", {
          name,
          countries: through.countries || t("noCountries"),
          // The supplier list words "none" as "No transfer", which is not what it means here.
          basis:
            through.mechanism && through.mechanism !== "none"
              ? basis(through.mechanism)
              : t("noBasis"),
        });
      case "inside":
        return t("inside", { name });
      case "open":
        return t("open", { name });
      default:
        return through satisfies never;
    }
  };
}
