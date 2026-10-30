"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createFirstTouch } from "@/lib/analytics/first-touch";
import { FROM_PATH_KEY, originPath } from "@/lib/analytics/token-routes";

type Query = Readonly<Record<string, string>>;

/**
 * Read as this module first loads in the browser, which is while the landing page hydrates. Reading
 * it later would see the address of a page reached by client-side navigation, which has no query.
 */
const firstTouch = createFirstTouch(() => window.location.search);
if (typeof window !== "undefined") firstTouch();

/**
 * What a link to sign-in, or to a gated page, hands on so a signup keeps its source: the campaign
 * tags of the first page this document showed (in memory only, see createFirstTouch), and the path
 * of the page the link sits on, which follows client-side navigation, so a link in a layout that
 * stays mounted does not keep the first page's path. Read after mount and stored nowhere, so the
 * server-rendered page stays the same for everyone.
 */
export function useSourceTags(): Query {
  const pathname = usePathname();
  const [tags, setTags] = useState<Query>({});
  useEffect(() => {
    const origin = originPath(pathname);
    setTags({ ...firstTouch(), ...(origin === null ? {} : { [FROM_PATH_KEY]: origin }) });
  }, [pathname]);
  return tags;
}
