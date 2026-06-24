"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Mail, Users, Send, Save, RefreshCw, Plus, Trash2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Props (inferred from tRPC, kept flat)
// ---------------------------------------------------------------------------

interface Stats {
  total: number;
  eligible: number;
  optedOut: number;
  disposable: number;
  unverified: number;
}

interface IssueRow {
  id: string;
  subject: string;
  status: "draft" | "sent";
  createdAt: Date;
  sentAt: Date | null;
  recipientCount: number | null;
  targetGroupName: string | null;
}

interface SubscriberRow {
  id: string;
  email: string;
  name: string;
  emailFollowupsDisabled: boolean;
  isDisposableEmail: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}

interface GroupRow {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  memberCount: number;
  eligibleCount: number;
}

interface Props {
  stats: Stats;
  issues: IssueRow[];
  subscribers: SubscriberRow[];
  groups: GroupRow[];
}

const ALL_AUDIENCE = "all";

function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function NewsletterAdmin({ stats, issues, subscribers, groups }: Props) {
  const router = useRouter();

  // Composer state
  const [issueId, setIssueId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

  // Audience target: "all" or a group id
  const [audience, setAudience] = useState<string>(ALL_AUDIENCE);
  const [testEmail, setTestEmail] = useState("");

  // Sent-issue viewer
  const [viewing, setViewing] = useState<{
    subject: string;
    html: string;
    meta: string;
    recipients: string[];
  } | null>(null);

  const previewMutation = trpc.newsletter.renderIssuePreview.useMutation({
    onSuccess: (data) => setPreviewHtml(data.html),
  });
  const saveMutation = trpc.newsletter.saveIssue.useMutation();
  const sendMutation = trpc.newsletter.sendIssue.useMutation();
  const testMutation = trpc.newsletter.sendTest.useMutation();
  const optOutMutation = trpc.newsletter.setEmailOptOut.useMutation();
  const getIssue = trpc.useUtils().newsletter.getIssue;

  const canRender = subject.trim().length > 0;

  // Live preview: debounce-render whenever subject / preheader / body changes.
  useEffect(() => {
    if (!canRender) {
      setPreviewHtml("");
      return;
    }
    const handle = setTimeout(() => {
      previewMutation.mutate({
        subject: subject.trim(),
        preheader: preheader.trim() || null,
        bodyMarkdown,
      });
    }, 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, preheader, bodyMarkdown, canRender]);

  const selectedGroup = audience === ALL_AUDIENCE ? null : groups.find((g) => g.id === audience);
  const targetCount = selectedGroup ? selectedGroup.eligibleCount : stats.eligible;
  const targetLabel = selectedGroup ? selectedGroup.name : "All eligible";

  function resetComposer() {
    setIssueId(null);
    setSubject("");
    setPreheader("");
    setBodyMarkdown("");
    setPreviewHtml("");
  }

  async function loadIssue(id: string) {
    try {
      const issue = await getIssue.fetch({ id });
      setIssueId(issue.id);
      setSubject(issue.subject);
      setPreheader(issue.preheader ?? "");
      setBodyMarkdown(issue.bodyMarkdown);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load issue");
    }
  }

  async function handleViewSent(id: string) {
    try {
      const issue = await getIssue.fetch({ id });
      const recipients = issue.recipientEmails ?? [];
      const sentDate = issue.sentAt ? fmtDate(issue.sentAt) : "—";
      setViewing({
        subject: issue.subject,
        html: issue.sentHtml ?? "<p style='padding:24px;font-family:sans-serif'>No snapshot stored for this issue.</p>",
        meta: `Sent ${sentDate} to ${issue.recipientCount ?? recipients.length} recipients`,
        recipients,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load issue");
    }
  }

  function composerPayload() {
    return {
      subject: subject.trim(),
      preheader: preheader.trim() || null,
      bodyMarkdown,
    };
  }

  function handleSaveDraft() {
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    saveMutation.mutate(
      { id: issueId ?? undefined, ...composerPayload() },
      {
        onSuccess: (data) => {
          setIssueId(data.id);
          toast.success("Draft saved");
          router.refresh();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleSendTest() {
    if (!subject.trim() || !bodyMarkdown.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    testMutation.mutate(
      { ...composerPayload(), testEmail: testEmail.trim() || null },
      {
        onSuccess: (res) => {
          if (res.devBlocked) {
            toast.info(`Dev mode: send to ${res.to} was suppressed (set ENABLE_EMAIL_IN_DEV=true).`);
          } else {
            toast.success(`Test sent to ${res.to}`);
          }
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  async function handleSend() {
    if (!subject.trim() || !bodyMarkdown.trim()) {
      toast.error("Subject and body are required before sending");
      return;
    }
    try {
      const saved = await saveMutation.mutateAsync({
        id: issueId ?? undefined,
        ...composerPayload(),
      });
      const result = await sendMutation.mutateAsync({
        id: saved.id,
        groupId: selectedGroup ? selectedGroup.id : null,
      });
      toast.success(`Issue queued to ${result.recipientCount} recipients (sending in bursts)`);
      resetComposer();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    }
  }

  const busy = saveMutation.isPending || sendMutation.isPending;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Mail className="h-6 w-6" /> Newsletter
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Opportunistic lifecycle email to verified, opted-in signups. Send only when there is a
          reason: a release, a short value drop, a new course, a feedback ask. Sends trickle out in
          bursts to protect deliverability.
        </p>
      </div>

      {/* Audience */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Total signups" value={stats.total} />
        <StatCard label="Eligible" value={stats.eligible} highlight />
        <StatCard label="Opted out" value={stats.optedOut} />
        <StatCard label="Disposable" value={stats.disposable} />
        <StatCard label="Unverified" value={stats.unverified} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Composer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{issueId ? "Edit draft" : "New issue"}</span>
              {issueId ? (
                <Button variant="ghost" size="sm" onClick={resetComposer}>
                  New
                </Button>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={500}
                placeholder="NIS 2 in one minute: ..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="preheader">Preheader (optional)</Label>
              <Input
                id="preheader"
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                maxLength={500}
                placeholder="Short preview text shown next to the subject"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="body">Body (markdown)</Label>
              <Textarea
                id="body"
                value={bodyMarkdown}
                onChange={(e) => setBodyMarkdown(e.target.value)}
                rows={14}
                className="font-mono text-sm"
                placeholder={"## Heading\n\nWrite the value inline. Links are fine, but the content lives in the email, not behind a teaser link.\n\n- point one\n- point two"}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="audience">Send to</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger id="audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_AUDIENCE}>All eligible ({stats.eligible})</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({g.eligibleCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Test send */}
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FlaskConical className="h-4 w-4" /> Test send
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Leave blank to send to yourself"
                  className="h-9 flex-1 min-w-[200px]"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSendTest}
                  disabled={testMutation.isPending || !canRender}
                >
                  {testMutation.isPending ? "Sending..." : "Send test"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={busy}>
                <Save className="h-4 w-4" /> Save draft
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" disabled={busy || !canRender}>
                    <Send className="h-4 w-4" /> Send
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Send this issue now?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Audience: <strong>{targetLabel}</strong> — about <strong>{targetCount}</strong>{" "}
                      eligible recipients (verified, not opted out, not disposable). Messages send in
                      bursts to protect deliverability. The issue is marked sent and cannot be edited
                      afterwards.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSend}>Send to {targetCount}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Preview</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!canRender || previewMutation.isPending}
                onClick={() =>
                  previewMutation.mutate({
                    subject: subject.trim(),
                    preheader: preheader.trim() || null,
                    bodyMarkdown,
                  })
                }
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {previewHtml ? (
              <iframe
                title="Newsletter preview"
                srcDoc={previewHtml}
                className="h-[560px] w-full rounded-md border bg-white"
              />
            ) : (
              <div className="flex h-[560px] items-center justify-center rounded-md border text-sm text-muted-foreground">
                Enter a subject to render the next issue.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Groups */}
      <GroupsCard groups={groups} subscribers={subscribers} />

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No issues yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className="text-right">Recipients</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{it.subject}</TableCell>
                    <TableCell>{it.targetGroupName ?? (it.status === "sent" ? "All eligible" : "—")}</TableCell>
                    <TableCell>
                      <Badge variant={it.status === "sent" ? "secondary" : "outline"}>
                        {it.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{fmtDate(it.sentAt)}</TableCell>
                    <TableCell className="text-right">{it.recipientCount ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {it.status === "draft" ? (
                        <Button variant="ghost" size="sm" onClick={() => loadIssue(it.id)}>
                          Edit
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleViewSent(it.id)}>
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Subscribers / manual opt-out */}
      <SubscriberTable
        subscribers={subscribers}
        onToggle={(userId, disabled) =>
          optOutMutation.mutate(
            { userId, disabled },
            {
              onSuccess: () => {
                toast.success(disabled ? "Email disabled" : "Email enabled");
                router.refresh();
              },
              onError: (err) => toast.error(err.message),
            },
          )
        }
        pending={optOutMutation.isPending}
      />

      {/* Sent-issue viewer: shows the exact HTML that was delivered */}
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{viewing?.subject ?? "Sent issue"}</DialogTitle>
          </DialogHeader>
          {viewing ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">{viewing.meta}</div>
              <iframe
                title="Sent issue"
                srcDoc={viewing.html}
                className="h-[60vh] w-full rounded-md border bg-white"
              />
              {viewing.recipients.length > 0 ? (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground">
                    Recipients ({viewing.recipients.length})
                  </summary>
                  <div className="mt-2 max-h-40 overflow-auto rounded-md border p-2 font-mono text-xs leading-relaxed">
                    {viewing.recipients.join(", ")}
                  </div>
                </details>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary" : undefined}>
      <CardContent className="p-4">
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

function GroupsCard({
  groups,
  subscribers,
}: {
  groups: GroupRow[];
  subscribers: SubscriberRow[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [managingId, setManagingId] = useState<string | null>(null);

  const createMutation = trpc.newsletter.createGroup.useMutation({
    onSuccess: () => {
      setNewName("");
      toast.success("Group created");
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.newsletter.deleteGroup.useMutation({
    onSuccess: () => {
      setManagingId(null);
      toast.success("Group deleted");
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const managing = managingId ? groups.find((g) => g.id === managingId) ?? null : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Groups
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Named audience segments. Send a campaign to one group instead of everyone. Group sends
          still skip opted-out, disposable and unverified addresses.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New group name"
            className="max-w-xs"
            maxLength={200}
          />
          <Button
            size="sm"
            onClick={() => newName.trim() && createMutation.mutate({ name: newName.trim() })}
            disabled={createMutation.isPending || !newName.trim()}
          >
            <Plus className="h-4 w-4" /> Create group
          </Button>
        </div>

        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No groups yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Eligible</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-right">{g.memberCount}</TableCell>
                  <TableCell className="text-right">{g.eligibleCount}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setManagingId(managingId === g.id ? null : g.id)}
                    >
                      {managingId === g.id ? "Close" : "Manage members"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete group &ldquo;{g.name}&rdquo;?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Membership is removed. Past issues sent to this group keep their history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate({ id: g.id })}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {managing ? (
          <GroupMembers group={managing} subscribers={subscribers} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function GroupMembers({
  group,
  subscribers,
}: {
  group: GroupRow;
  subscribers: SubscriberRow[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const utils = trpc.useUtils();
  const memberQuery = trpc.newsletter.groupMemberIds.useQuery({ groupId: group.id });
  const [memberSet, setMemberSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (memberQuery.data) setMemberSet(new Set(memberQuery.data));
  }, [memberQuery.data]);

  const addMutation = trpc.newsletter.addGroupMember.useMutation();
  const removeMutation = trpc.newsletter.removeGroupMember.useMutation();

  function toggle(userId: string, member: boolean) {
    // Optimistic: update local set immediately, then persist.
    setMemberSet((prev) => {
      const next = new Set(prev);
      if (member) next.add(userId);
      else next.delete(userId);
      return next;
    });
    const mutation = member ? addMutation : removeMutation;
    mutation.mutate(
      { groupId: group.id, userId },
      {
        onSuccess: () => {
          utils.newsletter.groupMemberIds.invalidate({ groupId: group.id });
          router.refresh();
        },
        onError: (err) => {
          toast.error(err.message);
          // Revert on failure
          setMemberSet((prev) => {
            const next = new Set(prev);
            if (member) next.delete(userId);
            else next.add(userId);
            return next;
          });
        },
      },
    );
  }

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter(
      (s) => s.email.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    );
  }, [subscribers, filter]);

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="text-sm font-medium">Members of &ldquo;{group.name}&rdquo;</div>
      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by email or name"
        className="max-w-sm"
      />
      <div className="max-h-[360px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Member</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.email}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={memberSet.has(s.id)}
                    onCheckedChange={(on) => toggle(s.id, on)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SubscriberTable({
  subscribers,
  onToggle,
  pending,
}: {
  subscribers: SubscriberRow[];
  onToggle: (userId: string, disabled: boolean) => void;
  pending: boolean;
}) {
  const [filter, setFilter] = useState("");
  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter(
      (s) => s.email.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    );
  }, [subscribers, filter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Subscribers
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Toggle email off to stop all sends to a signup. The account stays active. Disposable and
          unverified addresses are excluded from sends automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by email or name"
          className="max-w-sm"
        />
        <div className="max-h-[480px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="text-right">Email on</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell className="space-x-1">
                    {s.isDisposableEmail ? (
                      <Badge variant="destructive">disposable</Badge>
                    ) : null}
                    {!s.emailVerifiedAt ? <Badge variant="outline">unverified</Badge> : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={!s.emailFollowupsDisabled}
                      disabled={pending}
                      onCheckedChange={(on) => onToggle(s.id, !on)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
