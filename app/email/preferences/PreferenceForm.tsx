"use client";

import { useState } from "react";
import {
  CATEGORY_LABELS,
  PAGE_COPY,
  type PreferenceLocale,
  TYPE_LABELS,
} from "@/lib/mail/email-type-labels";
import type { EmailCategory, UserConsentEmailTypeId } from "@/lib/mail/email-types";

interface Group {
  category: EmailCategory;
  types: UserConsentEmailTypeId[];
}

/**
 * Optimistic toggles over the preference API. Each switch owns one scope
 * string; the master switch owns "all" and, while on, visually disables the
 * rest because it already overrides them in the gate — the UI states what
 * the server does rather than pretending the finer switches still apply.
 */
export function PreferenceForm({
  userId,
  token,
  locale,
  groups,
  allOptionalDisabled,
  optedOutScopes,
}: {
  userId: string;
  token: string;
  locale: PreferenceLocale;
  groups: Group[];
  allOptionalDisabled: boolean;
  optedOutScopes: string[];
}) {
  const copy = PAGE_COPY[locale];
  const [allOff, setAllOff] = useState(allOptionalDisabled);
  const [optedOut, setOptedOut] = useState<Set<string>>(new Set(optedOutScopes));
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function toggle(scope: string, subscribed: boolean) {
    const previousAll = allOff;
    const previous = new Set(optedOut);
    if (scope === "all") {
      setAllOff(!subscribed);
      if (subscribed) {
        const next = new Set(optedOut);
        next.delete("all");
        setOptedOut(next);
      }
    } else {
      const next = new Set(optedOut);
      if (subscribed) next.delete(scope);
      else next.add(scope);
      setOptedOut(next);
    }
    setStatus("idle");

    const res = await fetch("/api/email/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ u: userId, t: token, scope, subscribed }),
    }).catch(() => null);

    if (!res?.ok) {
      setAllOff(previousAll);
      setOptedOut(previous);
      setStatus("error");
      return;
    }
    setStatus("saved");
  }

  return (
    <div className="space-y-6">
      <label className="flex items-start gap-3 rounded-lg border border-border p-4">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={allOff}
          onChange={(e) => toggle("all", !e.target.checked)}
        />
        <span>
          <span className="font-medium">{copy.allOffTitle}</span>
          <span className="block text-sm text-muted-foreground">
            {copy.allOffDescription}
          </span>
        </span>
      </label>

      {groups.map((group) => {
        const categoryScope = `category:${group.category}`;
        const categoryOff = optedOut.has(categoryScope);
        const label = CATEGORY_LABELS[group.category][locale];
        return (
          <fieldset
            key={group.category}
            className={`space-y-3 rounded-lg border border-border p-4 ${allOff ? "opacity-50" : ""}`}
            disabled={allOff}
          >
            <legend className="px-1 font-medium">{label.title}</legend>
            <p className="text-sm text-muted-foreground">{label.description}</p>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={!categoryOff && !allOff}
                onChange={(e) => toggle(categoryScope, e.target.checked)}
              />
              <span>{label.title}</span>
            </label>
            <div className="space-y-2 pl-7">
              {group.types.map((type) => {
                const scope = `type:${type}`;
                const on = !allOff && !categoryOff && !optedOut.has(scope);
                return (
                  <label key={type} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={on}
                      disabled={allOff || categoryOff}
                      onChange={(e) => toggle(scope, e.target.checked)}
                    />
                    <span className="text-muted-foreground">
                      {TYPE_LABELS[type][locale]}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {CATEGORY_LABELS.security[locale].title}
          {" · "}
          {CATEGORY_LABELS.account[locale].title}
        </span>
        <span className="block">{copy.alwaysSent}</span>
        <span className="block">{CATEGORY_LABELS.security[locale].description}</span>
      </div>

      <p className="text-sm" role="status" aria-live="polite">
        {status === "saved" && (
          <span className="text-muted-foreground">{copy.saved}</span>
        )}
        {status === "error" && <span className="text-destructive">{copy.failed}</span>}
      </p>
    </div>
  );
}
