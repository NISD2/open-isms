import { GDPR_WALK } from "@/lib/durchgang";
import { guardWalkLocale } from "../gate";

/** The GDPR walk is written in German and English; any other page language walks it in English. */
export default async function GdprWalkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardWalkLocale(GDPR_WALK);
  return children;
}
