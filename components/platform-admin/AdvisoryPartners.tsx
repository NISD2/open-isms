"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PARTNER_SLUG_PATTERN } from "@/lib/advisory-options";
import { trpc } from "@/lib/trpc/client";

/**
 * Add and retire the firms requests can be sent to.
 *
 * This exists because the list cannot live in code: the repository is public,
 * and a self-hoster's partners are not ours. See `schema/tables/advisory-partner.ts`.
 *
 * Retiring rather than deleting, so a firm that stops taking referrals leaves
 * the picker while every referral already recorded against them keeps meaning.
 */
export function AdvisoryPartners() {
  const utils = trpc.useUtils();
  const partners = trpc.platformAdmin.advisoryPartners.useQuery();

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");

  const invalidate = () => {
    utils.platformAdmin.advisoryPartners.invalidate();
  };

  const add = trpc.platformAdmin.addAdvisoryPartner.useMutation({
    onSuccess: () => {
      setSlug("");
      setName("");
      invalidate();
    },
  });
  const setActive = trpc.platformAdmin.setAdvisoryPartnerActive.useMutation({
    onSuccess: invalidate,
  });

  const slugOk = PARTNER_SLUG_PATTERN.test(slug);
  const rows = partners.data ?? [];

  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Partner firms</h2>

      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          None yet. Requests cannot be recorded as sent until there is at least one.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {rows.map((p) => (
            <li key={p.slug} className="flex items-center gap-3 text-sm">
              <span className={p.active ? "" : "text-muted-foreground line-through"}>
                {p.name}
              </span>
              <span className="text-xs text-muted-foreground">{p.slug}</span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-7 text-xs"
                disabled={setActive.isPending}
                onClick={() => setActive.mutate({ slug: p.slug, active: !p.active })}
              >
                {p.active ? "Retire" : "Reactivate"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-4 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!slugOk || !name.trim() || add.isPending) return;
          add.mutate({ slug, name: name.trim() });
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="partner-name" className="text-xs">
            Name
          </Label>
          <Input
            id="partner-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            className="h-8 w-56 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="partner-slug" className="text-xs">
            Slug
          </Label>
          <Input
            id="partner-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            maxLength={60}
            placeholder="lowercase-with-dashes"
            className="h-8 w-56 text-sm"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={!slugOk || !name.trim() || add.isPending}
        >
          Add partner
        </Button>
      </form>
    </section>
  );
}
