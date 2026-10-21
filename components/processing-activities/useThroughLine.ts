"use client";

import { useTranslations } from "next-intl";
import type { ThroughSupplier } from "@/lib/durchgang";
import { throughLine } from "@/lib/processing-activities/record-lines";

/**
 * How the record words an activity's transfers through one supplier (Art. 30(1)(e)): the same
 * line on the walk's screen, the record page and its download.
 */
export function useThroughLine(): (name: string, through: ThroughSupplier) => string {
  const say = useTranslations("processingActivities");
  const basis = useTranslations("suppliers.transferMechanism");
  return (name, through) => throughLine(say, basis, name, through);
}
