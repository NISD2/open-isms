"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { segments } from "@/lib/platform-admin/named-ids";
import type { auditLogFor } from "@/lib/platform-admin/users";
import { trpc } from "@/lib/trpc/client";
import { CompanyName } from "./CompanyDialog";
import { ReachLine } from "./ReachLine";
import { TwoFactorAdmin } from "./TwoFactorAdmin";

const at = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
  timeStyle: "short",
});
export const when = (date: Date | string | null) =>
  date ? at.format(new Date(date)) : "—";

/**
 * A person's name anywhere on the platform admin page: a click opens everything about them in a
 * dialog (`UserDialog`), so nobody has to search the user list for it.
 */
export function UserName({ id, children }: { id: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-left underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-foreground"
      >
        {children}
      </button>
      {open && <UserDialog id={id} onClose={() => setOpen(false)} />}
    </>
  );
}

type Activity = Awaited<ReturnType<typeof auditLogFor>>["rows"][number];
type Named = Activity["named"];

const hasValue = (value: unknown) => value !== null && value !== undefined;

/**
 * Text from the log with every id that names a person or a company shown as that name: a
 * person opens their own dialog, a company (which has none yet) is the name alone.
 */
function WithNames({ text, named }: { text: string; named: Named }) {
  return segments(text, Object.keys(named)).map((part) => {
    if ("text" in part) return <span key={part.at}>{part.text}</span>;
    const found = named[part.id];
    if (!found) return <span key={part.at}>{part.id}</span>;
    return found.kind === "user" ? (
      <UserName key={part.at} id={part.id}>
        {found.name}
      </UserName>
    ) : (
      <span key={part.at}>
        {found.name} <span className="text-muted-foreground">(company)</span>
      </span>
    );
  });
}

/** A stored value as the log holds it, indented so a nested change can be read. */
function Stored({
  label,
  value,
  named,
}: {
  label: string;
  value: unknown;
  named: Named;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
        {hasValue(value) ? (
          <WithNames text={JSON.stringify(value, null, 2)} named={named} />
        ) : (
          "—"
        )}
      </pre>
    </div>
  );
}

/**
 * One entry of the log. An entry that stored values opens, on a click anywhere on its row (but
 * not while text in it is being selected), to show what was there before and what was saved; one
 * that stored none has nothing to open.
 */
function ActivityRow({ entry }: { entry: Activity }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const stored = hasValue(entry.previousValue) || hasValue(entry.newValue);
  const toggle = () => setOpen((o) => !o);
  return (
    <>
      <tr
        className={`border-b border-border/50 align-top last:border-0 ${stored ? "cursor-pointer hover:bg-muted/50" : ""}`}
        onClick={
          stored
            ? () => {
                // Dragging over the row to copy a line is not a request to open it.
                if ((window.getSelection()?.toString() ?? "") === "") toggle();
              }
            : undefined
        }
      >
        <td className="w-6 py-1.5 pr-1">
          {stored && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={open ? "Hide stored data" : "Show stored data"}
              onClick={(event) => {
                event.stopPropagation();
                toggle();
              }}
              className="text-muted-foreground"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
              />
            </button>
          )}
        </td>
        <td className="whitespace-nowrap py-1.5 pr-4 text-muted-foreground">
          {when(entry.at)}
        </td>
        <td className="py-1.5 pr-4">
          {entry.description}
          {entry.assistant && (
            <span className="text-muted-foreground"> · via {entry.assistant}</span>
          )}
        </td>
        <td className="py-1.5 pr-4 font-mono text-xs text-muted-foreground">
          {entry.action}
        </td>
        <td className="py-1.5 text-muted-foreground">
          {entry.companyId && entry.companyName ? (
            <CompanyName id={entry.companyId}>{entry.companyName}</CompanyName>
          ) : (
            (entry.companyName ?? "—")
          )}
        </td>
      </tr>
      {open && (
        <tr id={panelId} className="border-b border-border/50">
          <td />
          <td colSpan={4} className="pb-3">
            <p className="mb-2 font-mono text-xs text-muted-foreground">
              {entry.entityType}{" "}
              {entry.entityId &&
                (entry.named[entry.entityId] ? (
                  <WithNames text={`"${entry.entityId}"`} named={entry.named} />
                ) : (
                  entry.entityId
                ))}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Stored label="Before" value={entry.previousValue} named={entry.named} />
              <Stored label="Saved" value={entry.newValue} named={entry.named} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/** An audit log as a table, newest first; a person's dialog and a company's modal share it. */
export function ActivityTable({ rows }: { rows: readonly Activity[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2">
              <span className="sr-only">Show stored data</span>
            </th>
            <th className="pb-2 pr-4 font-medium">When (Berlin)</th>
            <th className="pb-2 pr-4 font-medium">What</th>
            <th className="pb-2 pr-4 font-medium">Action</th>
            <th className="pb-2 font-medium">Company</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <ActivityRow key={a.id} entry={a} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One person: the account, the companies they belong to, and their activity log, newest first. */
function UserDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  // A start after the end asks for nothing: say so, and keep the rows on screen.
  const rangeInOrder = !fromDay || !toDay || fromDay <= toDay;
  const detail = trpc.platformAdminUsers.detail.useQuery(
    { id, fromDay: fromDay || undefined, toDay: toDay || undefined },
    // Changing a day keeps the rows on screen until the new ones arrive.
    { enabled: rangeInOrder, placeholderData: (previous) => previous },
  );
  const data = detail.data;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{data?.person.name ?? "User"}</DialogTitle>
        </DialogHeader>
        {detail.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : data === null ? (
          <p className="text-sm text-muted-foreground">
            No such user. The account may have been erased.
          </p>
        ) : (
          <div className="space-y-6 text-sm">
            {data && (
              <>
                <ReachLine id={id} />
                <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr]">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{data.person.email}</dd>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{data.person.phone ?? "—"}</dd>
                  <dt className="text-muted-foreground">Signed up</dt>
                  <dd>{when(data.person.createdAt)}</dd>
                  <dt className="text-muted-foreground">Email verified</dt>
                  <dd>{when(data.person.emailVerifiedAt)}</dd>
                  <dt className="text-muted-foreground">Last sign-in</dt>
                  <dd>
                    {when(data.person.lastLoginAt)} ({data.person.loginCount} in total)
                  </dd>
                  <dt className="text-muted-foreground">Grandfathered</dt>
                  <dd>
                    {data.person.grandfatheredAt
                      ? when(data.person.grandfatheredAt)
                      : "no"}
                  </dd>
                </dl>

                <section className="space-y-2">
                  <h3 className="font-medium">Companies</h3>
                  {data.memberships.length === 0 ? (
                    <p className="text-muted-foreground">None.</p>
                  ) : (
                    <ul className="space-y-1">
                      {data.memberships.map((m) => (
                        <li key={m.companyId}>
                          <CompanyName id={m.companyId}>{m.companyName}</CompanyName>{" "}
                          <span className="text-muted-foreground">
                            · {m.role}
                            {m.jobTitle ? ` · ${m.jobTitle}` : ""} · since {when(m.since)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <TwoFactorAdmin userId={id} />
              </>
            )}

            <section className="space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h3 className="font-medium">
                  Activity{" "}
                  {data && (
                    <span className="font-normal text-muted-foreground">
                      ({data.activity.length}, newest first, at most 500)
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <label className="flex items-center gap-1.5">
                    From
                    <input
                      type="date"
                      value={fromDay}
                      max={toDay || undefined}
                      onChange={(e) => setFromDay(e.target.value)}
                      className="rounded-md border bg-background px-2 py-1 text-foreground"
                    />
                  </label>
                  <label className="flex items-center gap-1.5">
                    to
                    <input
                      type="date"
                      value={toDay}
                      min={fromDay || undefined}
                      onChange={(e) => setToDay(e.target.value)}
                      className="rounded-md border bg-background px-2 py-1 text-foreground"
                    />
                  </label>
                  {detail.isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
              {!rangeInOrder && (
                <p className="text-xs text-muted-foreground">
                  The first day is after the last day, so nothing new is asked for. Change
                  one of them.
                </p>
              )}
              {detail.error ? (
                <p className="text-sm text-destructive">{detail.error.message}</p>
              ) : !data ? null : data.activity.length === 0 ? (
                <p className="text-muted-foreground">
                  {fromDay || toDay
                    ? "Nothing in the activity log between these days."
                    : "Nothing in the activity log."}
                </p>
              ) : (
                <ActivityTable rows={data.activity} />
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
