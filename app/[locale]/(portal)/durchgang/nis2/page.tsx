import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DurchgangHome } from "@/components/durchgang/DurchgangHome";
import { loadWalk } from "../../../durchgang/nis2/load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("durchgang");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/** The Durchgang's front door: the introduction on a first visit, then "Ihr Weg". */
export default async function DurchgangHomePage() {
  return <DurchgangHome walk={await loadWalk()} />;
}
