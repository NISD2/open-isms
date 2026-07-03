"use client";

/**
 * Platform-admin GDPR erasure UI: a per-user "Erase" action with a
 * blast-radius confirm dialog, and an accountability log of past erasures
 * with downloadable certificates. Backed by platformAdmin.{previewErasure,
 * eraseUser, listErasures, erasureCertificate}.
 */
import { useState } from "react";
import { AlertTriangle, Download, Loader2, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function triggerDownload(filename: string, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function EraseUserButton({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 gap-1 px-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Erase
      </Button>
      {open && <EraseDialog userId={userId} email={email} onClose={() => setOpen(false)} />}
    </>
  );
}

function EraseDialog({ userId, email, onClose }: { userId: string; email: string; onClose: () => void }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const preview = trpc.platformAdmin.previewErasure.useQuery(
    { userId },
    { refetchOnWindowFocus: false },
  );

  const [confirmEmail, setConfirmEmail] = useState("");
  const [rightsInvoked, setRightsInvoked] = useState(
    "Right to erasure (Art. 17), all GDPR rights invoked",
  );
  const [requestDate, setRequestDate] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmOrgName, setConfirmOrgName] = useState("");

  const erase = trpc.platformAdmin.eraseUser.useMutation({
    onSuccess: async (res) => {
      toast.success(`Account erased. Case ${res.caseRef}. Downloading certificate.`);
      try {
        const cert = await utils.platformAdmin.erasureCertificate.fetch({ id: res.logId });
        triggerDownload(cert.filename, cert.markdown);
      } catch {
        toast.error("Erased, but the certificate download failed. Grab it from the Erasures tab.");
      }
      await utils.platformAdmin.listErasures.invalidate();
      onClose();
      router.refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const p = preview.data;
  const emailMatches = confirmEmail.trim().toLowerCase() === email.trim().toLowerCase();
  const orgName = p?.company?.name ?? "";
  const orgConfirmed = !p?.isOwner || confirmOrgName.trim().toLowerCase() === orgName.trim().toLowerCase();
  const canErase = Boolean(p) && emailMatches && orgConfirmed;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Erase account and all personal data
          </DialogTitle>
          <DialogDescription>
            Irreversible. This fulfils a GDPR Art. 17 erasure request and writes a durable,
            downloadable record you can send to the requester.
          </DialogDescription>
        </DialogHeader>

        {preview.isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculating what will be erased…
          </div>
        )}

        {preview.isError && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            <span>Could not load the preview: {preview.error.message}</span>
            <Button size="sm" variant="outline" className="h-7" onClick={() => preview.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {p && (
          <div className="space-y-3 text-sm">
            <div className="rounded-md border p-3">
              <div className="font-medium">{p.subject.name}</div>
              <div className="text-muted-foreground">{p.subject.email}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Role {p.subject.role} · {p.company ? `company: ${p.company.name}` : "no company"}
              </div>
            </div>

            <ul className="space-y-1 text-muted-foreground">
              <li>Personal records to delete: <b className="text-foreground">{p.personalRecordCount}</b></li>
              <li>Sign-off entries by this user: <b className="text-foreground">{p.signOffCount}</b></li>
              <li>
                Method:{" "}
                <b className="text-foreground">
                  {p.predictedMethod === "hard_delete" ? "complete deletion" : "deletion + anonymisation"}
                </b>
              </li>
            </ul>

            {p.company && !p.isOwner && (
              <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                This person is a member of <b>{p.company.name}</b>
                {p.memberCount > 1 ? ` (${p.memberCount - 1} other member${p.memberCount - 1 === 1 ? "" : "s"})` : ""}.
                Only their own account and data are removed. The organization and everyone else&apos;s work stay intact.
              </p>
            )}

            {p.isOwner && p.orgData && (
              <div className="rounded-md border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                <div className="mb-1 font-semibold">
                  This person OWNS {p.company?.name}. Erasing deletes the ENTIRE organization, including
                  everyone else on it:
                </div>
                <div className="grid grid-cols-2 gap-x-4">
                  <span>Member accounts: {p.orgData.memberAccounts}</span>
                  <span>Sign-offs: {p.orgData.signOffs}</span>
                  <span>Assessments: {p.orgData.assessments}</span>
                  <span>Assets: {p.orgData.assets}</span>
                  <span>Risks: {p.orgData.risks}</span>
                  <span>Incidents: {p.orgData.incidents}</span>
                  <span>Suppliers: {p.orgData.suppliers}</span>
                  <span>Policies: {p.orgData.policies}</span>
                </div>
              </div>
            )}

            <div className="space-y-2 border-t pt-3">
              <label className="block text-xs font-medium">
                Request received (optional)
                <Input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} className="mt-1" />
              </label>
              <label className="block text-xs font-medium">
                Rights invoked
                <Input value={rightsInvoked} onChange={(e) => setRightsInvoked(e.target.value)} className="mt-1" />
              </label>
              <label className="block text-xs font-medium">
                Notes (optional)
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-medium">
                Type the account email to confirm: <span className="font-mono text-foreground">{email}</span>
                <Input
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={email}
                  className="mt-1"
                  autoComplete="off"
                />
              </label>
              {p.isOwner && (
                <label className="block text-xs font-medium text-red-700 dark:text-red-300">
                  This deletes the whole organization. Type its name to confirm:{" "}
                  <span className="font-mono">{p.company?.name}</span>
                  <Input
                    value={confirmOrgName}
                    onChange={(e) => setConfirmOrgName(e.target.value)}
                    placeholder={p.company?.name ?? ""}
                    className="mt-1"
                    autoComplete="off"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={erase.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!canErase || erase.isPending}
            onClick={() =>
              erase.mutate({
                userId,
                confirmEmail,
                confirmOrgName: p?.isOwner ? confirmOrgName : undefined,
                rightsInvoked: rightsInvoked.trim() || undefined,
                notes: notes.trim() || undefined,
                requestReceivedAt: requestDate ? new Date(requestDate) : undefined,
              })
            }
          >
            {erase.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Erasing…
              </>
            ) : (
              "Permanently erase"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ErasuresPanel() {
  const utils = trpc.useUtils();
  const list = trpc.platformAdmin.listErasures.useQuery(undefined, { refetchOnWindowFocus: false });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const download = async (id: string) => {
    setDownloadingId(id);
    try {
      const cert = await utils.platformAdmin.erasureCertificate.fetch({ id });
      triggerDownload(cert.filename, cert.markdown);
    } catch {
      toast.error("Could not build the certificate.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Erasure log</CardTitle>
      </CardHeader>
      <CardContent>
        {list.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {list.data && list.data.length === 0 && (
          <p className="text-sm text-muted-foreground">No erasures recorded yet.</p>
        )}
        {list.data && list.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Case</th>
                  <th className="pb-2 pr-4 font-medium">Subject</th>
                  <th className="pb-2 pr-4 font-medium">Method</th>
                  <th className="pb-2 pr-4 font-medium">By</th>
                  <th className="pb-2 pr-4 font-medium">When</th>
                  <th className="pb-2 font-medium">Proof</th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs">{r.caseRef}</td>
                    <td className="py-2 pr-4">
                      <div>{r.subjectName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.subjectEmail ?? "(email cleared)"}
                        {r.companyName ? ` · ${r.companyName}` : ""}
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      {r.method === "hard_delete" ? "deleted" : "anonymised"}
                      {r.companyTornDown ? " + company" : ""}
                    </td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground">{r.actorEmail}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {new Date(r.erasedAt).toLocaleDateString("de-DE")}
                    </td>
                    <td className="py-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2"
                        disabled={downloadingId === r.id}
                        onClick={() => download(r.id)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Certificate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
