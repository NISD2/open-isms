"use client";

import { type ComponentProps, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { campaignTags } from "@/lib/analytics/token-routes";

type Query = Readonly<Record<string, string>>;

/**
 * A link to sign-in that hands on the page's own campaign tags, so a signup keeps the campaign it
 * came from. Like BookingLink, they are read from the address bar after mount and stored nowhere,
 * so the server-rendered page stays the same for everyone.
 */
export function SignInLink({
  query,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { readonly query?: Query }) {
  const [tags, setTags] = useState<Query>({});
  useEffect(() => setTags(Object.fromEntries(campaignTags(window.location.search))), []);
  return (
    <Link {...props} href={{ pathname: "/auth/signin", query: { ...query, ...tags } }} />
  );
}
