"use client";

/**
 * The partner's side of /partner-agreement/[token]: the document's signature block, and the form
 * that accepts it. The document text itself is rendered on the server from the stored copy and
 * arrives as children, so what is shown is what gets hashed on acceptance.
 *
 * Acceptance waits for the server before it shows as done: a legal act is signed only once it is
 * saved. Everything typed stays in the form when the save fails.
 */
import { CheckCircle2 } from "lucide-react";
import { createTranslator } from "next-intl";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatPartnerContractDate,
  type PartnerContractLocale,
} from "@/lib/partner-contract/date";
import type { PartnerContractPageMessages } from "@/lib/partner-contract/document";
import { trpc } from "@/lib/trpc/client";

interface Acceptance {
  readonly name: string;
  readonly email: string;
  readonly at: Date;
  /** Null when the page is reopened later: the mail went out, or not, back then. */
  readonly partnerCopySent: boolean | null;
}

interface Props {
  readonly children: ReactNode;
  readonly token: string;
  readonly locale: PartnerContractLocale;
  readonly messages: PartnerContractPageMessages;
  readonly company: string;
  readonly contactEmail: string;
  readonly seller: { readonly director: string; readonly email: string };
  readonly offeredAt: Date;
  readonly prefill: { readonly name: string; readonly email: string };
  readonly accepted: Omit<Acceptance, "partnerCopySent"> | null;
}

type FieldError = "name" | "email" | "authority";

const looksLikeEmail = (value: string) => {
  const at = value.indexOf("@");
  return at > 0 && value.lastIndexOf(".") > at + 1 && !value.includes(" ");
};

function SignatureLine({
  caption,
  children,
}: {
  readonly caption: string;
  readonly children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {caption}
      </p>
      <div className="mt-3 min-h-16 border-b border-foreground/40 pb-2 text-sm leading-6">
        {children}
      </div>
    </div>
  );
}

export function PartnerAgreement(props: Props) {
  const { locale, company } = props;
  const t = createTranslator({
    locale,
    messages: { page: props.messages },
    namespace: "page",
  });
  const ids = { name: useId(), email: useId(), authority: useId() };

  const [name, setName] = useState(props.prefill.name);
  const [email, setEmail] = useState(props.prefill.email);
  const [authority, setAuthority] = useState(false);
  const [errors, setErrors] = useState<readonly FieldError[]>([]);
  const [acceptance, setAcceptance] = useState<Acceptance | null>(
    props.accepted ? { ...props.accepted, partnerCopySent: null } : null,
  );

  const accept = trpc.partnerContract.accept.useMutation({
    onSuccess: (r, input) =>
      setAcceptance({
        name: input.name,
        email: input.email,
        at: r.signedAt,
        partnerCopySent: r.partnerCopySent,
      }),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: FieldError[] = [
      ...(name.trim().length < 2 ? (["name"] as const) : []),
      ...(looksLikeEmail(email.trim()) ? [] : (["email"] as const)),
      ...(authority ? [] : (["authority"] as const)),
    ];
    setErrors(found);
    if (found.length > 0) return;
    accept.mutate({
      token: props.token,
      name: name.trim(),
      email: email.trim(),
      authority: true,
    });
  };

  const hint = (field: FieldError, message: string) =>
    errors.includes(field) ? (
      <p className="text-sm text-amber-800 dark:text-amber-300">{message}</p>
    ) : null;

  return (
    <>
      <article
        lang={locale}
        className="rounded-lg border bg-background px-5 py-8 shadow-sm sm:px-12 sm:py-12"
      >
        {props.children}

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <SignatureLine caption={t("forSeller")}>
            <p className="font-medium">
              {t("sellerSigner", { director: props.seller.director })}
            </p>
            <p className="text-muted-foreground">
              {t("offered", { date: formatPartnerContractDate(props.offeredAt, locale) })}
            </p>
          </SignatureLine>
          <SignatureLine caption={t("forPartner", { company })}>
            {acceptance ? (
              <>
                <p className="font-medium">
                  {acceptance.name}, {acceptance.email}
                </p>
                <p className="text-muted-foreground">
                  {t("acceptedOn", {
                    date: formatPartnerContractDate(acceptance.at, locale, true),
                  })}
                </p>
              </>
            ) : (
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                {t("pending")}
              </span>
            )}
          </SignatureLine>
        </div>
      </article>

      {acceptance ? (
        <section
          aria-live="polite"
          className="rounded-lg bg-primary px-6 py-6 text-primary-foreground sm:px-8"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" aria-hidden />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">{t("done.title")}</h2>
              {acceptance.partnerCopySent === null ? null : (
                <p className="text-sm leading-6 opacity-90">
                  {acceptance.partnerCopySent
                    ? t("done.mailSent", { email: acceptance.email })
                    : t("done.mailNotSent")}
                </p>
              )}
              <p className="text-sm leading-6 opacity-90">
                {t("done.next", { email: props.contactEmail })}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <form
          onSubmit={submit}
          noValidate
          className="space-y-5 rounded-lg border bg-background px-5 py-6 shadow-sm sm:px-8"
        >
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">{t("form.heading")}</h2>
            <p className="max-w-[62ch] text-sm leading-6 text-muted-foreground">
              {t("form.intro")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={ids.name}>{t("form.name")}</Label>
              <Input
                id={ids.name}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
              {hint("name", t("form.errors.name"))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={ids.email}>{t("form.email")}</Label>
              <Input
                id={ids.email}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
              {hint("email", t("form.errors.email"))}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id={ids.authority}
                checked={authority}
                onChange={(e) => setAuthority(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-primary"
              />
              <Label htmlFor={ids.authority} className="font-normal leading-6">
                {t("form.authority", { company })}
              </Label>
            </div>
            {hint("authority", t("form.errors.authority", { company }))}
          </div>
          {accept.isError ? (
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {accept.error.data?.code === "TOO_MANY_REQUESTS"
                ? accept.error.message
                : t("form.errors.save")}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={accept.isPending}>
              {accept.isPending ? t("form.submitting") : t("form.submit")}
            </Button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {t("questions", { email: props.contactEmail })}
      </p>
    </>
  );
}
