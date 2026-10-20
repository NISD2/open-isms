"use client";

import { Loader2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";

const at = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
  timeStyle: "short",
});
const when = (date: Date | string | null) => (date ? at.format(new Date(date)) : "—");

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

/** One person: the account, the companies they belong to, and their activity log, newest first. */
function UserDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const detail = trpc.platformAdminUsers.detail.useQuery({ id });
  const data = detail.data;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{data?.person.name ?? "User"}</DialogTitle>
        </DialogHeader>
        {detail.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : detail.error ? (
          <p className="text-sm text-destructive">{detail.error.message}</p>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">
            No such user. The account may have been erased.
          </p>
        ) : (
          <div className="space-y-6 text-sm">
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
                {data.person.grandfatheredAt ? when(data.person.grandfatheredAt) : "no"}
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
                      {m.companyName}{" "}
                      <span className="text-muted-foreground">
                        · {m.role}
                        {m.jobTitle ? ` · ${m.jobTitle}` : ""} · since {when(m.since)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="font-medium">
                Activity{" "}
                <span className="font-normal text-muted-foreground">
                  ({data.activity.length}, newest first, at most 500)
                </span>
              </h3>
              {data.activity.length === 0 ? (
                <p className="text-muted-foreground">Nothing in the activity log.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">When (Berlin)</th>
                        <th className="pb-2 pr-4 font-medium">What</th>
                        <th className="pb-2 pr-4 font-medium">Action</th>
                        <th className="pb-2 font-medium">Company</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.activity.map((a) => (
                        <tr
                          key={a.id}
                          className="border-b border-border/50 align-top last:border-0"
                        >
                          <td className="whitespace-nowrap py-1.5 pr-4 text-muted-foreground">
                            {when(a.at)}
                          </td>
                          <td className="py-1.5 pr-4">{a.description}</td>
                          <td className="py-1.5 pr-4 font-mono text-xs text-muted-foreground">
                            {a.action}
                          </td>
                          <td className="py-1.5 text-muted-foreground">
                            {a.companyName ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
