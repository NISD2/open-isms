"use client";

import { Loader2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { ActivityTable, UserName, when } from "./UserDialog";

/**
 * A company's name anywhere in the admin's dialogs: a click opens the company in a modal
 * (`CompanyDialog`), with its people and what it did. The person and company dialogs open each
 * other, which is safe because neither is used until it renders.
 */
export function CompanyName({ id, children }: { id: string; children: ReactNode }) {
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
      {open && <CompanyDialog id={id} onClose={() => setOpen(false)} />}
    </>
  );
}

const orDash = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "—" : String(value);
const yesNo = (value: boolean) => (value ? "yes" : "no");

/** One company: profile and plan, the walkthrough, every member, and the company's activity. */
function CompanyDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const query = trpc.platformAdminUsers.company.useQuery({ id });
  const data = query.data;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{data?.company.name || "Company"}</DialogTitle>
        </DialogHeader>
        {query.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : query.error ? (
          <p className="text-sm text-destructive">{query.error.message}</p>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">No such company.</p>
        ) : (
          <div className="space-y-6 text-sm">
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr_10rem_1fr]">
              <dt className="text-muted-foreground">Sector</dt>
              <dd>{orDash(data.company.sector)}</dd>
              <dt className="text-muted-foreground">Entity type</dt>
              <dd>{orDash(data.company.entityType)}</dd>
              <dt className="text-muted-foreground">Employees</dt>
              <dd>{orDash(data.company.employeeCount)}</dd>
              <dt className="text-muted-foreground">Country</dt>
              <dd>{orDash(data.company.country)}</dd>
              <dt className="text-muted-foreground">Plan</dt>
              <dd>{orDash(data.company.plan)}</dd>
              <dt className="text-muted-foreground">Access level</dt>
              <dd>{orDash(data.company.accessLevel)}</dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{when(data.company.createdAt)}</dd>
              <dt className="text-muted-foreground">Activated</dt>
              <dd>{when(data.company.activatedAt)}</dd>
              <dt className="text-muted-foreground">Critical installation</dt>
              <dd>{orDash(data.company.criticalInstallation)}</dd>
              <dt className="text-muted-foreground">Assistants allowed</dt>
              <dd>{yesNo(data.company.assistantsAllowed)}</dd>
              <dt className="text-muted-foreground">Acts as NIS2 entity</dt>
              <dd>{yesNo(data.company.actsAsNis2Entity)}</dd>
              <dt className="text-muted-foreground">Acts as supplier</dt>
              <dd>{yesNo(data.company.actsAsSupplier)}</dd>
            </dl>

            <section className="space-y-2">
              <h3 className="font-medium">
                Walkthrough{" "}
                <span className="font-normal text-muted-foreground">
                  ({data.walkthrough.settled} of {data.walkthrough.steps} settled)
                </span>
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {data.walkthrough.items.map((item) => (
                  <li
                    key={item.code}
                    className="rounded-md border px-2 py-0.5 font-mono text-xs"
                  >
                    {item.code}{" "}
                    <span className="text-muted-foreground">{item.state}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-medium">
                Members{" "}
                <span className="font-normal text-muted-foreground">
                  ({data.members.length})
                </span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Person</th>
                      <th className="pb-2 pr-4 font-medium">Role</th>
                      <th className="pb-2 pr-4 font-medium">Last sign-in (Berlin)</th>
                      <th className="pb-2 pr-4 font-medium">Courses</th>
                      <th className="pb-2 font-medium">Work here</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.members.map((m) => (
                      <tr key={m.userId} className="border-b border-border/50 align-top">
                        <td className="py-1.5 pr-4">
                          <UserName id={m.userId}>{m.name}</UserName>
                          <div className="text-xs text-muted-foreground">{m.email}</div>
                        </td>
                        <td className="py-1.5 pr-4">
                          {m.role}
                          {m.jobTitle ? ` · ${m.jobTitle}` : ""}
                        </td>
                        <td className="whitespace-nowrap py-1.5 pr-4">
                          {when(m.lastLoginAt)}{" "}
                          <span className="text-muted-foreground">({m.loginCount})</span>
                        </td>
                        <td className="py-1.5 pr-4">
                          {m.courses.length === 0
                            ? "—"
                            : m.courses.map((c) => (
                                <div key={c.courseId}>
                                  {c.courseId} {c.lessonsDone}/{c.lessonsTotal}
                                  {c.finished ? " done" : ""}
                                </div>
                              ))}
                        </td>
                        <td className="py-1.5">
                          {m.workInThisCompany
                            ? `${m.workInThisCompany.actions} actions, last ${when(m.workInThisCompany.lastActionAt)}, ${m.workInThisCompany.signOffs} sign-offs`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-medium">
                Activity{" "}
                <span className="font-normal text-muted-foreground">
                  ({data.activity.length}, newest first, at most 200)
                </span>
              </h3>
              {data.activity.length === 0 ? (
                <p className="text-muted-foreground">Nothing in the activity log.</p>
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
