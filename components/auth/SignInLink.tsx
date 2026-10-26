"use client";

import { type ComponentProps, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { REGISTRATION_STARTED_EVENT } from "@/lib/analytics/ads-consent";
import { campaignTags, FROM_PATH_KEY, originPath } from "@/lib/analytics/token-routes";

type Query = Readonly<Record<string, string>>;

/**
 * A link to sign-in that hands on the page's own campaign tags and its own path, so a signup keeps
 * the campaign it came from and the page it clicked "register" on (the only source an organic
 * visitor has). Like BookingLink, they are read from the address bar after mount and stored
 * nowhere, so the server-rendered page stays the same for everyone.
 */
export function SignInLink({
  query,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { readonly query?: Query }) {
  const [tags, setTags] = useState<Query>({});
  useEffect(() => {
    const origin = originPath(window.location.pathname);
    setTags({
      ...Object.fromEntries(campaignTags(window.location.search)),
      ...(origin === null ? {} : { [FROM_PATH_KEY]: origin }),
    });
  }, []);
  return (
    <Link
      {...props}
      href={{ pathname: "/auth/signin", query: { ...query, ...tags } }}
      onClick={(event) => {
        onClick?.(event);
        // Heard only by the Google Ads tag, and only when the visitor agreed to it.
        if (query?.mode === "register")
          window.dispatchEvent(new Event(REGISTRATION_STARTED_EVENT));
      }}
    />
  );
}
