"use client";

import type { ComponentProps } from "react";
import { useSourceTags } from "@/components/auth/useSourceTags";
import { Link } from "@/i18n/navigation";

/**
 * A link from a public page to a gated one, e.g. "Start the course" to a lesson. A visitor without
 * a session is sent to sign-in by the proxy, which sees only this request, so the link hands on
 * what the sign-in card needs to record the source: the campaign tags and the path of the page it
 * sits on. The proxy keeps them (withSourceTags); a signed-in visitor just opens the page.
 */
export function GatedLink({ href, ...props }: ComponentProps<typeof Link>) {
  const tags = useSourceTags();
  if (typeof href === "string") return <Link {...props} href={href} />;
  const own = typeof href.query === "object" && href.query !== null ? href.query : {};
  return <Link {...props} href={{ ...href, query: { ...own, ...tags } }} />;
}
