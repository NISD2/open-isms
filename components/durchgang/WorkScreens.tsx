"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileSignature,
  FileText,
  ListChecks,
  ScrollText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { BigChecklist } from "@/components/asset-inventory/BigChecklist";
import { FileUpload } from "@/components/compliance/FileUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  type ResolvedScreen,
  recordedDay,
  type SuggestSource,
  sliceOf,
} from "@/lib/durchgang";
import type { FieldMeta } from "@/lib/forms/schema-introspect";
import { trpc } from "@/lib/trpc/client";
import { ArtThumb } from "./Art";
import { asInput, type Draft, type DraftUpdate } from "./draft";
import { Aside, Heading, Lead, ProvisionView, Source } from "./ExplainScreens";
import { InfoTip } from "./InfoTip";
import { ManagementReviews } from "./ManagementReviews";
import { PersonPick } from "./PersonPick";
import { Suggestions } from "./Suggestions";
import { SupplierList } from "./SupplierList";
import { TrainingRecords } from "./TrainingRecords";
import { useRecorded } from "./useRecorded";
import type { ItemView, WalkEntry } from "./view";

export type Of<K extends ResolvedScreen["kind"]> = Extract<ResolvedScreen, { kind: K }>;

export interface WorkProps {
  readonly item: ItemView;
  readonly draft: Draft;
  readonly onDraft: DraftUpdate;
}

/** Big choice cards on a real radio group: choice fields, yes or no. */
function Choice({
  id,
  name,
  options,
  value,
  onChange,
}: {
  id: string;
  name: string;
  options: ReadonlyArray<{ value: string; label: string; detail?: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <RadioGroup
      aria-label={name}
      value={value}
      onValueChange={onChange}
      className="grid gap-2"
    >
      {options.map((option) => (
        <Label
          key={option.value}
          htmlFor={`${id}-${option.value}`}
          className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 font-normal transition-colors hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/[0.05]"
        >
          <RadioGroupItem
            id={`${id}-${option.value}`}
            value={option.value}
            className="mt-0.5"
          />
          <span>
            <span className="block font-medium">{option.label}</span>
            {option.detail && (
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                {option.detail}
              </span>
            )}
          </span>
        </Label>
      ))}
    </RadioGroup>
  );
}

function FieldInput({
  id,
  meta,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  meta: FieldMeta | undefined;
  label: string;
  options: Readonly<Record<string, string>> | undefined;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const t = useTranslations("durchgang.ui");
  switch (meta?.type) {
    case "enum":
      return (
        <Choice
          id={id}
          name={label}
          value={asInput(meta, value)}
          onChange={onChange}
          options={(meta.options ?? []).map((o) => ({
            value: o,
            label: options?.[o] ?? o,
          }))}
        />
      );
    case "boolean":
      return (
        <Choice
          id={id}
          name={label}
          value={value === true ? "yes" : value === false ? "no" : ""}
          onChange={(v) => onChange(v === "yes")}
          options={[
            { value: "yes", label: t("yes") },
            { value: "no", label: t("no") },
          ]}
        />
      );
    case "number":
      return (
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={meta.min}
          max={meta.max}
          className="mt-2 h-12 max-w-40 rounded-xl text-base"
          value={asInput(meta, value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "date":
      return (
        <Input
          id={id}
          type="date"
          className="mt-2 h-12 max-w-56 rounded-xl text-base"
          value={asInput(meta, value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (meta?.maxLength ?? 0) > 255 ? (
        <Textarea
          id={id}
          className="mt-2 min-h-28 rounded-xl text-base"
          maxLength={meta?.maxLength}
          value={asInput(meta, value)}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={meta?.type === "email" ? "email" : "text"}
          className="mt-2 h-12 rounded-xl text-base"
          maxLength={meta?.maxLength}
          value={asInput(meta, value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/** A field's common answers from the company's own data: its software, or its contact domain. */
function useOwnSuggestions(from: SuggestSource | undefined): readonly string[] {
  const assets = trpc.asset.list.useQuery(undefined, { enabled: from === "software" });
  const contact = trpc.durchgang.contactSuggestions.useQuery(undefined, {
    enabled: from === "contact",
  });
  if (from === "contact") return contact.data ?? [];
  return (assets.data ?? []).flatMap((a) =>
    sliceOf(a.type) === "software" ? [a.name] : [],
  );
}

export function Fields({
  item,
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"fields"> }) {
  const t = useTranslations("durchgang.ui");
  const suggest = entry.screen.suggest;
  const own = useOwnSuggestions(suggest?.from);
  const { steps, source } = entry.copy;
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      {steps && (
        <ol className="mt-6 max-w-[62ch] space-y-3">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3 text-[15px] leading-7">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground tabular-nums">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
      {entry.screen.provision && (
        <div className="mt-6">
          <ProvisionView item={item} provision={entry.screen.provision} />
        </div>
      )}
      <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b bg-muted/40 px-5 py-3">
          <FileText className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">{entry.copy.document}</p>
          {!entry.screen.person && !steps && (
            <span className="ml-auto text-xs text-muted-foreground">{t("copyFrom")}</span>
          )}
        </div>
        <div className="space-y-7 p-5 sm:p-6">
          {entry.copy.fields.map((field) => {
            const id = `dg-${field.key}`;
            const value = draft.values[field.key];
            const onChange = (next: unknown) =>
              onDraft({ ...draft, values: { ...draft.values, [field.key]: next } });
            return (
              <div key={field.key} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={id} className="text-[15px] font-semibold">
                    {field.label}
                  </Label>
                  <InfoTip label={t("fieldHelp", { label: field.label })}>
                    {field.hint}
                  </InfoTip>
                </div>
                {entry.screen.person === field.key ? (
                  <PersonPick
                    id={id}
                    label={field.label}
                    value={typeof value === "string" ? value : ""}
                    onChange={onChange}
                    team={item.team}
                    viewer={item.viewer}
                  />
                ) : (
                  <FieldInput
                    id={id}
                    meta={item.fields[field.key]}
                    label={field.label}
                    options={field.options}
                    value={value}
                    onChange={onChange}
                  />
                )}
                {suggest?.field === field.key && (
                  <Suggestions
                    own
                    items={own}
                    value={typeof value === "string" ? value : ""}
                    onChange={onChange}
                  />
                )}
                <Suggestions
                  items={field.suggestions ?? []}
                  value={typeof value === "string" ? value : ""}
                  onChange={onChange}
                />
              </div>
            );
          })}
        </div>
      </div>
      {source && <Source>{source}</Source>}
    </>
  );
}

export function Evidence({
  item,
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"evidence"> }) {
  const t = useTranslations("durchgang.ui");
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <div className="mt-8 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <p className="flex items-center gap-2 text-sm font-medium">
          <FileSignature className="size-4 text-muted-foreground" />
          {entry.copy.document}
        </p>
        <div className="mt-4">
          {item.statusId ? (
            <FileUpload
              requirementStatusId={item.statusId}
              onUploaded={(name) => onDraft({ ...draft, uploaded: name })}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("noStatus")}</p>
          )}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{t("uploadFirst")}</p>
    </>
  );
}

/** Once the method is adopted, the card shows that day and moving on writes nothing again. */
export function Adopt({
  item,
  entry,
  adoptedAt,
}: {
  item: ItemView;
  entry: Of<"adopt">;
  adoptedAt: Date | null;
}) {
  const t = useTranslations("durchgang.ui");
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <article className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <header className="flex items-center gap-3 border-b bg-muted/40 px-5 py-3">
          <ScrollText className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">{t("record")}</p>
          <p className="ml-auto text-xs text-muted-foreground">
            {adoptedAt
              ? t("adoptedOn", { date: recordedDay(item.locale, adoptedAt) })
              : recordedDay(item.locale, new Date())}
          </p>
        </header>
        <dl className="divide-y">
          {entry.copy.lines.map((line) => (
            <div
              key={line.label}
              className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6"
            >
              <dt className="text-sm text-muted-foreground">{line.label}</dt>
              <dd className="text-sm font-medium">{line.text}</dd>
            </div>
          ))}
        </dl>
        <footer className="border-t bg-muted/20 px-5 py-5">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <div className="h-8 border-b border-dashed border-foreground/30" />
              <p className="mt-2 text-xs text-muted-foreground">{t("signLine")}</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              {t("pending")}
            </span>
          </div>
        </footer>
      </article>
    </>
  );
}

export function Assets({
  item,
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"assets"> }) {
  const t = useTranslations("durchgang.ui");
  // What is already on the register shows ticked and stays: the walk only ever adds.
  const listed = item.register?.listed ?? [];
  const others = item.register?.others ?? [];
  const count =
    listed.length + others.length + draft.checked.length + draft.custom.length;
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
        <ListChecks className="size-4" />
        {t("onList", { count })}
      </p>
      {others.length > 0 && (
        <Aside className="mt-3">{t("alsoListed", { names: others.join(", ") })}</Aside>
      )}
      <div className="mt-6">
        <BigChecklist
          sectors={[]}
          groups={entry.screen.groups}
          checked={[...listed, ...draft.checked]}
          custom={[...draft.custom]}
          onCheckedChange={(checked) =>
            onDraft({ ...draft, checked: checked.filter((id) => !listed.includes(id)) })
          }
          onCustomChange={(custom) => onDraft({ ...draft, custom })}
        />
      </div>
    </>
  );
}

export function Register({ item, entry }: { item: ItemView; entry: Of<"register"> }) {
  const t = useTranslations("durchgang.ui");
  const { screen } = entry;
  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <div className="mt-8">
        {(() => {
          switch (screen.module) {
            case "training_record":
              return (
                <TrainingRecords
                  initial={item.registers.training_record ?? []}
                  locale={item.locale}
                  audience={screen.audience}
                />
              );
            case "management_review":
              return (
                <ManagementReviews
                  initial={item.registers.management_review ?? []}
                  locale={item.locale}
                />
              );
            case "supplier":
              return <SupplierList initial={item.registers.supplier ?? []} />;
            default:
              return screen satisfies never;
          }
        })()}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{t("registerHint")}</p>
    </>
  );
}

export function Done({
  item,
  entry,
  draft,
  next,
  onNext,
}: {
  item: ItemView;
  entry: Of<"done">;
  draft: Draft;
  next: WalkEntry | null;
  /** The footer's primary action; the card for what comes next does the same. */
  onNext: () => void;
}) {
  const t = useTranslations("durchgang.ui");
  const recorded = useRecorded(item, draft);
  return (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground sm:p-10">
        <CheckCircle2 className="size-12" strokeWidth={1.5} />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
          {entry.copy.title}
        </h1>
        {recorded.length > 0 && (
          <>
            <p className="mt-2 text-primary-foreground/80">{t("recorded")}</p>
            <ul className="mt-6 space-y-2">
              {recorded.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[15px]">
                  <Check className="mt-1 size-4 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      {entry.copy.note && <Aside className="mt-6">{entry.copy.note}</Aside>}
      {next && next.code !== item.code && (
        <button
          type="button"
          onClick={onNext}
          className="group mt-8 flex w-full cursor-pointer items-center gap-5 rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
        >
          <ArtThumb src={next.image} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{t("comesNext")}</p>
            <p className="text-lg font-semibold">{next.headline}</p>
            <p className="text-sm text-muted-foreground">{next.teaser}</p>
          </div>
          <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
        </button>
      )}
    </>
  );
}
