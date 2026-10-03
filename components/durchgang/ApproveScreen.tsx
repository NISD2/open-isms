"use client";

import { Check, ChevronDown, Copy, Send, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPathname, Link, useRouter } from "@/i18n/navigation";
import {
  APPROVAL_SCREEN,
  enteredDay,
  GAP_STEP,
  MANAGEMENT_ROLE,
  type PolicyTemplate,
  type WalkLocale,
} from "@/lib/durchgang";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";
import { userFacingError } from "@/lib/trpc/error-message";
import { Heading, Lead } from "./ExplainScreens";
import { Toggle } from "./RowParts";
import type { ItemView } from "./view";
import type { Of } from "./WorkScreens";

type Viewer = ItemView["viewer"];
/** An item waiting for management's signature, as the approval screen lists it. */
type Waiting = RouterOutputs["durchgang"]["awaitingSignature"][number];

/** Where management approves, for the link and the invite. */
export const APPROVAL_PATH = "/durchgang/nis2/freigabe";

/** Whether the approval screen holds what it needs: nothing is left waiting for management. */
export const approvalReady = (
  rows: ReadonlyArray<{ readonly status: string }> | undefined,
): boolean => rows?.every((row) => row.status !== "draft") ?? false;

/** 7.3: every document the walk wrote, and who approves them. */
export function Approve({ item, entry }: { item: ItemView; entry: Of<"approve"> }) {
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <Approval viewer={item.viewer} locale={item.locale} />
    </>
  );
}

/**
 * The documents the walk wrote, each readable in place, and the approval. Management approves
 * here, signed in with its own account, which records who approved and when; anyone else sends
 * management the page. The same list is the whole of the page management is invited to.
 */
export function Approval({ viewer, locale }: { viewer: Viewer; locale: WalkLocale }) {
  const t = useTranslations("durchgang.ui.approve");
  const utils = trpc.useUtils();
  const { data: rows } = trpc.durchgang.walkPolicies.useQuery();
  const { data: items } = trpc.durchgang.awaitingSignature.useQuery({ locale });
  const { data: gaps } = trpc.durchgang.gaps.useQuery({ locale });
  /** The drafts left out of this approval; every other draft is approved. */
  const [left, setLeft] = useState<readonly PolicyTemplate[]>([]);
  const approve = trpc.durchgang.approvePolicies.useMutation({
    onSuccess: async (result) => {
      setLeft([]);
      await Promise.all([
        utils.durchgang.walkPolicies.invalidate(),
        utils.durchgang.awaitingSignature.invalidate(),
        utils.policy.list.invalidate(),
      ]);
      const said = [
        ...(result.approved > 0 ? [t("done")] : []),
        ...(result.signed > 0 ? [t("signedDone", { count: result.signed })] : []),
      ];
      if (said.length > 0) toast.success(said.join(" "));
      else toast.info(t("unchanged"));
    },
    onError: (err) => toast.error(userFacingError(err, t("failed"))),
  });

  if (rows === undefined || items === undefined) return null;
  if (rows.length === 0 && items.length === 0) {
    return <p className="mt-8 text-muted-foreground">{t("none")}</p>;
  }

  const drafts = rows.filter((row) => row.status === "draft");
  const chosen = drafts.filter((row) => !left.includes(row.type));
  const toggle = (type: PolicyTemplate) =>
    setLeft(left.includes(type) ? left.filter((x) => x !== type) : [...left, type]);
  /** An item stays open when one of its drafts is left out of this approval. */
  const staysOpen = (item: Waiting) => item.drafts.some((type) => left.includes(type));
  const signing = items.filter((item) => !staysOpen(item));

  return (
    <>
      {rows.length > 0 && (
        <ul className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
          {rows.map((row) => (
            <li key={`${row.code}:${row.type}`} className="px-5 py-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6">
                <p className="font-medium break-words">{row.title}</p>
                {row.status !== "draft" ? (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Check className="size-4 text-primary" />
                    {row.effectiveFrom
                      ? t(row.approver ? "approvedBy" : "approvedOn", {
                          date: enteredDay(locale, row.effectiveFrom),
                          name: row.approver ?? "",
                        })
                      : t("approvedUndated")}
                  </p>
                ) : viewer.management ? (
                  <Toggle on={!left.includes(row.type)} onClick={() => toggle(row.type)}>
                    {t("approve")}
                  </Toggle>
                ) : (
                  <span className="text-sm text-muted-foreground">{t("waiting")}</span>
                )}
              </div>
              <details className="group mt-2">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-primary">
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                  {t("read")}
                </summary>
                <div
                  className="prose prose-sm mt-4 max-w-[68ch] dark:prose-invert"
                  // Rendered on the server from the stored text, without raw HTML.
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: see above
                  dangerouslySetInnerHTML={{ __html: row.html }}
                />
              </details>
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 && (
        <SignedWith items={items} staysOpen={staysOpen} management={viewer.management} />
      )}
      {gaps !== undefined && gaps.length > 0 && <OpenPoints gaps={gaps} />}
      {(drafts.length > 0 || items.length > 0) &&
        (viewer.management ? (
          <section className="mt-6 rounded-2xl border border-primary/30 bg-primary/[0.04] p-5 sm:p-6">
            <p className="text-sm leading-6">{t("asManagement")}</p>
            <Button
              size="lg"
              className="mt-4 rounded-xl"
              disabled={
                (chosen.length === 0 && signing.length === 0) || approve.isPending
              }
              onClick={() =>
                APPROVAL_SCREEN &&
                approve.mutate({
                  code: APPROVAL_SCREEN.code,
                  types: chosen.map((row) => row.type),
                  sign: signing.map((item) => item.code),
                })
              }
            >
              <UserCheck />
              {chosen.length > 0
                ? t("approveCount", { count: chosen.length })
                : t("signCount", { count: signing.length })}
            </Button>
          </section>
        ) : (
          <SendToManagement viewer={viewer} locale={locale} />
        ))}
    </>
  );
}

/**
 * The items of the walk this approval signs off, so management sees what its click finishes
 * besides the documents. An item whose document is left out stays open and says why.
 */
function SignedWith({
  items,
  staysOpen,
  management,
}: {
  items: readonly Waiting[];
  staysOpen: (item: Waiting) => boolean;
  management: boolean;
}) {
  const t = useTranslations("durchgang.ui.approve");
  return (
    <section className="mt-8">
      <p className="font-semibold">{t(management ? "signTitle" : "signTitleOthers")}</p>
      <p className="mt-1 max-w-[60ch] text-sm leading-6 text-muted-foreground">
        {t(management ? "signLead" : "signLeadOthers")}
      </p>
      <ul className="mt-4 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
        {items.map((item) => (
          <li key={item.code} className="flex items-baseline gap-3 px-5 py-3">
            <span className="w-10 shrink-0 text-sm tabular-nums text-muted-foreground">
              {item.code}
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-medium break-words">{item.headline}</span>
              {item.declined !== null && (
                <span className="block text-sm text-muted-foreground">
                  {t("declined", { reason: item.declined })}
                </span>
              )}
              {staysOpen(item) && (
                <span className="block text-sm text-muted-foreground">
                  {t("staysOpen")}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type OpenGap = RouterOutputs["durchgang"]["gaps"][number];

/**
 * What the company's own answers still leave open, each with the step where it changes, so
 * management sees it before it signs (§ 38 Abs. 1 BSIG). Amber says "look here", never "failed"
 * (ui-design principle 10), and no count heads it (principle 7).
 */
function OpenPoints({ gaps }: { gaps: readonly OpenGap[] }) {
  const t = useTranslations("durchgang.ui.approve.gaps");
  const lines = gaps.flatMap((gap): { text: string; code: string }[] => {
    switch (gap.kind) {
      case "second_factor":
        return [
          {
            text: gap.all
              ? t("secondFactorAll")
              : t("secondFactor", { names: gap.names.join(", ") }),
            code: GAP_STEP.second_factor,
          },
        ];
      case "supplier":
        return [
          {
            text: t("supplier", { names: gap.names.join(", ") }),
            code: GAP_STEP.supplier,
          },
        ];
      case "restore":
        return [
          { text: t("restore", { names: gap.names.join(", ") }), code: GAP_STEP.restore },
        ];
      case "reporting":
        return [{ text: t("reporting"), code: GAP_STEP.reporting }];
      case "training":
        return [
          {
            text:
              gap.trained.length === 0
                ? t("trainingNone")
                : t("training", {
                    names: gap.trained.join(", "),
                    managers: gap.managers,
                  }),
            code: GAP_STEP.training,
          },
        ];
      case "set_aside":
        return gap.codes.map((code, i) => ({
          text: t("setAside", { headline: gap.headlines[i] ?? code }),
          code,
        }));
      default:
        return gap satisfies never;
    }
  });
  return (
    <section className="mt-8 rounded-2xl border border-amber-300/70 bg-amber-50/70 p-5 sm:p-6 dark:border-amber-500/40 dark:bg-amber-950/20">
      <p className="font-semibold">{t("title")}</p>
      <p className="mt-1 max-w-[62ch] text-sm leading-6 text-muted-foreground">
        {t("lead")}
      </p>
      <ul className="mt-4 space-y-2.5">
        {lines.map((line) => (
          <li
            key={`${line.code}:${line.text}`}
            className="flex items-baseline gap-3 text-sm"
          >
            <span className="min-w-0 flex-1">{line.text}</span>
            <Link
              href={{ pathname: "/durchgang/nis2/[code]", params: { code: line.code } }}
              className="shrink-0 font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("change")}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * When the person walking is not management: who in the team is, with the page's link to send
 * them, an invite for someone not in the team yet, and for an admin who is management
 * themselves, one click to say so.
 */
function SendToManagement({ viewer, locale }: { viewer: Viewer; locale: WalkLocale }) {
  const t = useTranslations("durchgang.ui.approve");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const members = trpc.team.listMembers.useQuery();
  const managers = (members.data ?? []).filter(
    (m) => m.jobTitle === MANAGEMENT_ROLE && m.id !== viewer.id,
  );
  const path = getPathname({ href: APPROVAL_PATH, locale });
  const invite = trpc.team.invite.useMutation({
    onSuccess: (data, input) => {
      setEmail("");
      if (data.emailed) toast.success(t("invited", { email: input.email }));
      else toast.warning(t("notEmailed", { email: input.email }));
    },
    onError: (err) => toast.error(userFacingError(err, t("failed"))),
  });
  const claim = trpc.team.assignRole.useMutation({
    onSuccess: () => router.refresh(),
    onError: (err) => toast.error(userFacingError(err, t("failed"))),
  });
  const copy = () => {
    navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="mt-6 space-y-5 rounded-2xl border bg-muted/30 p-5 sm:p-6">
      <div>
        <p className="font-semibold">{t("sendTitle")}</p>
        <p className="mt-1 max-w-[60ch] text-sm leading-6 text-muted-foreground">
          {t("sendLead")}
        </p>
      </div>
      {managers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm">
            {t("managers", {
              names: managers.map((m) => m.name?.trim() || m.email).join(", "),
            })}
          </p>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {t("copyLink")}
          </Button>
        </div>
      )}
      {viewer.admin && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) {
              invite.mutate({
                email: email.trim(),
                complianceRole: MANAGEMENT_ROLE,
                redirectPath: path,
              });
            }
          }}
        >
          <label htmlFor="dg-management-email" className="text-sm font-medium">
            {t("inviteLabel")}
          </label>
          <div className="flex max-w-md gap-2">
            <Input
              id="dg-management-email"
              type="email"
              required
              placeholder={t("placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={invite.isPending}>
              <Send />
              {t("send")}
            </Button>
          </div>
        </form>
      )}
      {!viewer.admin && managers.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("askAdmin")}</p>
      )}
      {viewer.admin && (
        <button
          type="button"
          disabled={claim.isPending}
          onClick={() => claim.mutate({ userId: viewer.id, roleKey: MANAGEMENT_ROLE })}
          className="cursor-pointer text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("itsMe")}
        </button>
      )}
    </section>
  );
}
