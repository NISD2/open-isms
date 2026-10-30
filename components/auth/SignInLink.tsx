"use client";

import type { ComponentProps } from "react";
import { useSourceTags } from "@/components/auth/useSourceTags";
import { Link } from "@/i18n/navigation";
import { REGISTRATION_STARTED_EVENT } from "@/lib/analytics/ads-consent";

type Query = Readonly<Record<string, string>>;

/** Heard only by the Google Ads tag, and only when the visitor agreed to it. */
const announceRegistration = (): void => {
  window.dispatchEvent(new Event(REGISTRATION_STARTED_EVENT));
};

/**
 * A link to sign-in that hands on the campaign tags and the current page's path, so a signup keeps
 * the campaign it came from and the page it clicked "register" on (the only source an organic
 * visitor has). See useSourceTags for what is read, from where, and why nothing is stored.
 */
export function SignInLink({
  query,
  onClick,
  onAuxClick,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { readonly query?: Query }) {
  const tags = useSourceTags();
  return (
    <Link
      {...props}
      href={{ pathname: "/auth/signin", query: { ...query, ...tags } }}
      onClick={(event) => {
        onClick?.(event);
        if (query?.mode === "register") announceRegistration();
      }}
      // A middle click opens registration in a new tab and fires no click event.
      onAuxClick={(event) => {
        onAuxClick?.(event);
        if (query?.mode === "register" && event.button === 1) announceRegistration();
      }}
    />
  );
}
