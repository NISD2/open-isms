"use client";

import { Check, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADVISORY_TOPICS, type AdvisoryTopic } from "@/lib/advisory-options";
import { trpc } from "@/lib/trpc/client";

/**
 * Step one: a subject and an address, and nothing else.
 *
 * Two ordering decisions carry this step.
 *
 * The first interaction is a click rather than a keystroke. Choosing from a
 * row of buttons costs nothing and starts the thing; an empty text field asks
 * a stranger to compose something before they have decided anything.
 *
 * The address is asked last and alone, because it is the field people leave
 * on, so nothing competes with it and nothing follows it.
 */
export function AdvisoryRequestStep({
  defaultTopic,
  requirementCode,
  sourcePath,
  onSaved,
}: {
  defaultTopic?: AdvisoryTopic;
  requirementCode?: string | null;
  sourcePath?: string | null;
  onSaved: (requestId: string) => void;
}) {
  const t = useTranslations("help.request");
  const locale = useLocale();

  const [topic, setTopic] = useState<AdvisoryTopic>(defaultTopic ?? "scope");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  const submit = trpc.advisory.submit.useMutation({
    onSuccess: ({ id }) => onSaved(id),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!consent || submit.isPending) return;
    submit.mutate({
      topic,
      email: email.trim(),
      sourcePath: sourcePath ?? undefined,
      requirementCode: requirementCode ?? undefined,
      // Read at submit rather than kept in state: it is a constant for the
      // life of the page, and the only thing that answers whether a request
      // came out of search or out of a post. Empty for a direct visit, and
      // empty is itself the answer, so it is dropped rather than stored.
      referrer:
        typeof document !== "undefined" && document.referrer
          ? document.referrer.slice(0, 1000)
          : undefined,
      locale,
      forwardConsent: true,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-lg border bg-card p-5"
      aria-labelledby="advisory-request-heading"
    >
      <div className="space-y-1">
        <h2 id="advisory-request-heading" className="text-lg font-semibold">
          {t("heading")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("subheading")}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">{t("fields.topic")}</legend>
        {/*
          Buttons rather than a dropdown. A dropdown hides every option until it
          is opened, so the reader has to work out what kind of answer is wanted
          before they can give one. Laid out flat, the list doubles as the
          answer to "is this even for me".
        */}
        <div className="flex flex-wrap gap-2">
          {ADVISORY_TOPICS.map((value) => {
            const active = value === topic;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTopic(value)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {active && <Check className="size-3.5" aria-hidden="true" />}
                {t(`topics.${value}`)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="advisory-email">{t("fields.email")}</Label>
        <Input
          id="advisory-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={320}
          autoComplete="email"
          placeholder={t("placeholders.email")}
        />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="advisory-consent"
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked === true)}
        />
        <Label
          htmlFor="advisory-consent"
          className="text-sm font-normal leading-snug text-muted-foreground"
        >
          {t("consent")}
        </Label>
      </div>

      <div className="space-y-2">
        <Button type="submit" disabled={!consent || submit.isPending} className="gap-2">
          {submit.isPending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {t("cta")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("reassurance")}</p>
        {submit.isError && (
          <p className="text-sm text-destructive" role="alert">
            {t("error")}
          </p>
        )}
      </div>
    </form>
  );
}
