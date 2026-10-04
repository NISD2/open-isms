import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DurchgangItem } from "@/components/durchgang/DurchgangItem";
import { getSession } from "@/lib/auth";
import { requireWalk } from "../../gate";
import { loadItem, loadWalk } from "../load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("durchgang");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * One item of the Durchgang, one screen at a time. The screen index is `?s=`, written by the
 * client as the person moves, so a reload or the back button keeps the place.
 */
export default async function DurchgangItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const [{ code }, { s }] = await Promise.all([params, searchParams]);
  await requireWalk(code);
  const [item, walk, session] = await Promise.all([
    loadItem(code),
    loadWalk({ locked: false }),
    getSession(),
  ]);
  if (!item) notFound();
  return (
    <DurchgangItem
      key={code}
      item={item}
      walk={walk}
      setup={!session?.companyActivated}
      initialScreen={Number(s ?? 0)}
    />
  );
}
