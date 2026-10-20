"use client";

import { useEffect, useState } from "react";
import { ADMIN_TAB_SLUGS, DEFAULT_TAB, type Tab, tabOfSlug } from "./admin-tabs";

const ROOT = "/platform-admin";

/** The address up to and including /platform-admin, whatever locale prefix precedes it. */
const rootOf = (pathname: string) => {
  const at = pathname.indexOf(ROOT);
  return at === -1 ? ROOT : pathname.slice(0, at + ROOT.length);
};

/** The tab the current address names; /platform-admin alone is the default tab. */
const tabOfAddress = (pathname: string): Tab =>
  // What follows "/platform-admin/"; nothing there is the default tab.
  tabOfSlug(pathname.slice(rootOf(pathname).length + 1)) ?? DEFAULT_TAB;

/**
 * The open tab, kept in the address (/platform-admin/<slug>). A click writes the address without
 * reloading the page, so the data already loaded stays; back and forward move between tabs.
 */
export function useAdminTab(initial: Tab): readonly [Tab, (tab: Tab) => void] {
  const [tab, setTab] = useState<Tab>(initial);

  useEffect(() => {
    const onBack = () => setTab(tabOfAddress(window.location.pathname));
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);

  const open = (next: Tab) => {
    setTab(next);
    const path = `${rootOf(window.location.pathname)}/${ADMIN_TAB_SLUGS[next]}`;
    if (path !== window.location.pathname) window.history.pushState(null, "", path);
  };

  return [tab, open] as const;
}
