"use client";

import { useState } from "react";
import {
  Activity,
  BadgeCheck,
  Building2,
  GraduationCap,
  Loader2,
  Mail,
  Shield,
  Trash2,
  Truck,
  Users,
} from "lucide-react";
import { trpc, type RouterInputs } from "@/lib/trpc/client";
import { toast } from "sonner";

type CourseId = RouterInputs["platformAdmin"]["trainingMarkCourseComplete"]["courseId"];
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EraseUserButton, ErasuresPanel } from "./GdprErasure";

// ---------------------------------------------------------------------------
// Types (inferred from tRPC, kept flat for props)
// ---------------------------------------------------------------------------

interface Overview {
  totalUsers: number;
  recentUsers: number;
  totalCompanies: number;
  activatedCompanies: number;
  draftCompanies: number;
  usersWithActivatedCompany: number;
  totalAssessments: number;
  ceoCourseFinished: number;
  ceoCourseStarted: number;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  companyId: string | null;
  companyName: string | null;
  companySector: string | null;
  companyPlan: string | null;
}

interface CompanyRow {
  id: string;
  name: string;
  sector: string;
  entityType: string;
  plan: string;
  employeeCount: number | null;
  actsAsNis2Entity: boolean;
  actsAsSupplier: boolean;
  activatedAt: Date | null;
  createdAt: Date;
  userCount: number;
  compliancePct: string;
}

interface ComplianceRow {
  companyName: string;
  companyId: string;
  adminEmail: string | null;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}

interface TrainingRow {
  userId: string;
  userName: string;
  userEmail: string;
  companyName: string | null;
  totalLessons: number;
  completedLessons: number;
  quizzesPassed: number;
  ceoTouched: number;
  ceoCompleted: number;
  ceoQuizzes: number;
  craTouched: number;
  craCompleted: number;
  craQuizzes: number;
  tabletopTouched: number;
  tabletopCompleted: number;
  tabletopQuizzes: number;
  lastActivity: string;
}

/**
 * Course id + lesson count per table column (count = sum of
 * module.lessonIds in each course definition). One map so the id and
 * the total shown next to it cannot drift apart.
 */
const COURSES = {
  ceo: { id: "nis2-ceo", total: 47 },
  cra: { id: "cra-sbom", total: 9 },
  tabletop: { id: "nis2-tabletop", total: 8 },
} as const;

interface SupplierRow {
  companyId: string;
  companyName: string;
  sector: string;
  createdAt: Date;
  customerCount: number;
}

interface EmailRow {
  id: string;
  sentAt: Date | null;
  subject: string;
  entityType: string;
  triggerField: string;
  recipientEmail: string | null;
  companyName: string | null;
}

interface OptedOutUserRow {
  id: string;
  email: string;
  name: string;
  companyName: string | null;
  updatedAt: Date;
}

interface EmailActivity {
  totalSent: number;
  sentLast7d: number;
  totalUsers: number;
  optedOut: number;
  typeBreakdown: Array<{ type: string; count: number }>;
  recentEmails: EmailRow[];
  optedOutUsers: OptedOutUserRow[];
}

interface Props {
  overview: Overview;
  users: UserRow[];
  companies: CompanyRow[];
  complianceActivity: ComplianceRow[];
  trainingActivity: TrainingRow[];
  supplierActivity: SupplierRow[];
  emailActivity: EmailActivity;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString("de-DE");
}

function planBadge(plan: string | null) {
  if (!plan || plan === "free") return <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">free</span>;
  if (plan === "guided") return <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">guided</span>;
  return <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">{plan}</span>;
}

type Tab = "users" | "companies" | "compliance" | "training" | "suppliers" | "emails" | "erasures";

/** Human-readable label for a notification.entityType value. */
function emailTypeLabel(t: string): string {
  switch (t) {
    case "course_followup": return "Course follow-up";
    case "requirement": return "Compliance reminder";
    case "policy": return "Policy reminder";
    case "supplier_publication_event": return "Supplier incident broadcast";
    default: return t;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlatformAdminPage({
  overview,
  users,
  companies,
  complianceActivity,
  trainingActivity,
  supplierActivity,
  emailActivity,
}: Props) {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Shield className="h-8 w-8 text-red-600" />}
        title="Platform Admin"
        description="Cross-company overview — only visible to platform operators"
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={"/platform-admin/newsletter" as never}>
            <Mail className="h-4 w-4" /> Newsletter
          </Link>
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Users" value={overview.totalUsers} sub={`${overview.recentUsers} this week`} />
        <StatCard label="Activated Users" value={overview.usersWithActivatedCompany} sub={`of ${overview.totalUsers}`} />
        <StatCard label="Activated Orgs" value={overview.activatedCompanies} sub={`${overview.draftCompanies} draft`} />
        <StatCard label="CEO Course Done" value={overview.ceoCourseFinished} sub={`of ${overview.ceoCourseStarted} started`} />
        <StatCard label="Assessments" value={overview.totalAssessments} />
        <StatCard label="Not Activated" value={overview.totalUsers - overview.usersWithActivatedCompany} sub="draft shell only" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/50 p-1">
        {([
          { key: "users" as const, label: "Users", icon: Users, count: users.length },
          { key: "companies" as const, label: "Companies", icon: Building2, count: companies.length },
          { key: "compliance" as const, label: "Compliance", icon: Activity, count: complianceActivity.length },
          { key: "training" as const, label: "Training", icon: GraduationCap, count: trainingActivity.length },
          { key: "suppliers" as const, label: "Suppliers", icon: Truck, count: supplierActivity.length },
          { key: "emails" as const, label: "Emails", icon: Mail, count: emailActivity.totalSent },
          { key: "erasures" as const, label: "Erasures", icon: Trash2, count: undefined as number | undefined },
        ]).map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {typeof count === "number" && <span className="text-xs text-muted-foreground">({count})</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "users" && <UsersTable users={users} />}
      {tab === "companies" && <CompaniesTable companies={companies} />}
      {tab === "compliance" && <ComplianceTable rows={complianceActivity} />}
      {tab === "training" && <TrainingTable rows={trainingActivity} />}
      {tab === "suppliers" && <SuppliersTable rows={supplierActivity} />}
      {tab === "emails" && <EmailsPanel data={emailActivity} />}
      {tab === "erasures" && <ErasuresPanel />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Users table
// ---------------------------------------------------------------------------

function UsersTable({ users }: { users: UserRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">All Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Company</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 pr-4 font-medium">Joined</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4 font-medium">{u.name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{u.email}</td>
                  <td className="py-2 pr-4">{u.companyName ?? <span className="text-muted-foreground italic">none</span>}</td>
                  <td className="py-2 pr-4">{planBadge(u.companyPlan)}</td>
                  <td className="py-2 pr-4">{u.role}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{timeAgo(u.createdAt)}</td>
                  <td className="py-2"><EraseUserButton userId={u.id} email={u.email} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Companies table
// ---------------------------------------------------------------------------

function CompaniesTable({ companies }: { companies: CompanyRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">All Companies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Company</th>
                <th className="pb-2 pr-4 font-medium">Sector</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 font-medium">Users</th>
                <th className="pb-2 pr-4 font-medium">Compliance</th>
                <th className="pb-2 pr-4 font-medium">Flags</th>
                <th className="pb-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4 font-medium">{c.name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{c.sector}</td>
                  <td className="py-2 pr-4">{c.entityType}</td>
                  <td className="py-2 pr-4">{planBadge(c.plan)}</td>
                  <td className="py-2 pr-4">{c.userCount}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-1.5 rounded-full bg-green-500"
                          style={{ width: `${Math.min(100, parseFloat(c.compliancePct))}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{parseFloat(c.compliancePct).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 space-x-1">
                    {!c.activatedAt && <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Draft</span>}
                    {c.actsAsNis2Entity && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">NIS2</span>}
                    {c.actsAsSupplier && <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-xs text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">Supplier</span>}
                  </td>
                  <td className="py-2 text-muted-foreground">{timeAgo(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Compliance activity table
// ---------------------------------------------------------------------------

function ComplianceTable({ rows }: { rows: ComplianceRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Compliance Progress by Company</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Company</th>
                <th className="pb-2 pr-4 font-medium">Admin</th>
                <th className="pb-2 pr-4 font-medium">Total</th>
                <th className="pb-2 pr-4 font-medium">Completed</th>
                <th className="pb-2 pr-4 font-medium">In Progress</th>
                <th className="pb-2 pr-4 font-medium">Not Started</th>
                <th className="pb-2 font-medium">Progress</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pct = r.total > 0 ? (r.completed / r.total) * 100 : 0;
                return (
                  <tr key={r.companyId} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4 font-medium">{r.companyName}</td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground">
                      {r.adminEmail ? (
                        <a href={`mailto:${r.adminEmail}`} className="underline-offset-2 hover:underline">{r.adminEmail}</a>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{r.total}</td>
                    <td className="py-2 pr-4 text-green-600">{r.completed}</td>
                    <td className="py-2 pr-4 text-blue-600">{r.inProgress}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{r.notStarted}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-gray-200 dark:bg-gray-700">
                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No compliance activity yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Training activity table
// ---------------------------------------------------------------------------

function TrainingTable({ rows }: { rows: TrainingRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Training Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">User</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Company</th>
                <th className="pb-2 pr-4 font-medium" title="Completed / total lessons in the CEO course (47)">
                  CEO
                </th>
                <th className="pb-2 pr-4 font-medium" title="Completed / total lessons in the CRA-SBOM course (9)">
                  CRA
                </th>
                <th className="pb-2 pr-4 font-medium" title="Completed / total lessons in the NIS2 Tabletop course (8)">
                  Tabletop
                </th>
                <th className="pb-2 pr-4 font-medium" title="Quizzes passed across all courses">
                  Quizzes
                </th>
                <th className="pb-2 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4 font-medium">{r.userName}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{r.userEmail}</td>
                  <td className="py-2 pr-4">{r.companyName ?? <span className="text-muted-foreground italic">none</span>}</td>
                  <td className="py-2 pr-4 tabular-nums">
                    <CourseCell completed={r.ceoCompleted} total={COURSES.ceo.total} touched={r.ceoTouched} courseId={COURSES.ceo.id} userId={r.userId} userEmail={r.userEmail} />
                  </td>
                  <td className="py-2 pr-4 tabular-nums">
                    <CourseCell completed={r.craCompleted} total={COURSES.cra.total} touched={r.craTouched} courseId={COURSES.cra.id} userId={r.userId} userEmail={r.userEmail} />
                  </td>
                  <td className="py-2 pr-4 tabular-nums">
                    <CourseCell completed={r.tabletopCompleted} total={COURSES.tabletop.total} touched={r.tabletopTouched} courseId={COURSES.tabletop.id} userId={r.userId} userEmail={r.userEmail} />
                  </td>
                  <td className="py-2 pr-4 tabular-nums">{r.quizzesPassed}</td>
                  <td className="py-2 text-muted-foreground">{r.lastActivity ? timeAgo(r.lastActivity) : "-"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No training activity yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseCell({
  completed,
  total,
  touched,
  courseId,
  userId,
  userEmail,
}: {
  completed: number;
  total: number;
  touched: number;
  courseId: CourseId;
  userId: string;
  userEmail: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {touched === 0 ? (
        <span className="text-muted-foreground/50">—</span>
      ) : (
        <span title={`${touched} lesson${touched === 1 ? "" : "s"} touched`}>
          <span className="text-green-600">{completed}</span>
          <span className="text-muted-foreground">/{total}</span>
        </span>
      )}
      {completed < total && (
        <MarkCourseCompleteButton courseId={courseId} userId={userId} userEmail={userEmail} />
      )}
    </span>
  );
}

function MarkCourseCompleteButton({
  courseId,
  userId,
  userEmail,
}: {
  courseId: CourseId;
  userId: string;
  userEmail: string;
}) {
  const router = useRouter();
  const mark = trpc.platformAdmin.trainingMarkCourseComplete.useMutation({
    onSuccess: (res) => {
      toast.success(`Marked ${res.courseId} complete (${res.lessonCount} lessons) for ${userEmail}`);
      router.refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-6 px-1.5 text-muted-foreground hover:text-green-600"
      title={`Mark ${courseId} fully complete for ${userEmail}`}
      disabled={mark.isPending}
      onClick={() => {
        if (window.confirm(`Mark ${courseId} fully complete for ${userEmail}?`)) {
          mark.mutate({ userId, courseId });
        }
      }}
    >
      {mark.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <BadgeCheck className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Suppliers table
// ---------------------------------------------------------------------------

function SuppliersTable({ rows }: { rows: SupplierRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Supplier Portal Companies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Company</th>
                <th className="pb-2 pr-4 font-medium">Sector</th>
                <th className="pb-2 pr-4 font-medium">Customers</th>
                <th className="pb-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.companyId} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4 font-medium">{r.companyName}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{r.sector}</td>
                  <td className="py-2 pr-4">{r.customerCount}</td>
                  <td className="py-2 text-muted-foreground">{timeAgo(r.createdAt)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No supplier portal companies yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Emails panel — outbound emails + subscription state
// ---------------------------------------------------------------------------

function EmailsPanel({ data }: { data: EmailActivity }) {
  const subscribed = data.totalUsers - data.optedOut;
  const optOutRate = data.totalUsers > 0 ? (data.optedOut / data.totalUsers) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Sent (all time)" value={data.totalSent} sub="cron-driven only" />
        <StatCard label="Sent (last 7 days)" value={data.sentLast7d} />
        <StatCard label="Subscribed users" value={subscribed} sub={`of ${data.totalUsers}`} />
        <StatCard label="Opted out" value={data.optedOut} sub={`${optOutRate.toFixed(1)}% opt-out`} />
      </div>

      {/* Scope note */}
      <p className="text-xs text-muted-foreground italic">
        Scope: emails recorded in the notification table (course follow-ups, daily digests, weekly management digests, deadline reminders).
        Transactional emails (invites, welcome, contact-change notices, supplier incident broadcasts) are not yet logged here.
      </p>

      {/* Breakdown by type */}
      {data.typeBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sent by type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.typeBreakdown.map((b) => (
                <span
                  key={b.type}
                  className="rounded bg-muted px-2.5 py-1 text-xs text-foreground"
                >
                  {emailTypeLabel(b.type)} <span className="font-semibold">{b.count}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent emails */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent outbound emails (last 100)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Sent</th>
                  <th className="pb-2 pr-4 font-medium">Recipient</th>
                  <th className="pb-2 pr-4 font-medium">Company</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 font-medium">Subject</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEmails.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                      {e.sentAt ? timeAgo(e.sentAt) : "—"}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{e.recipientEmail ?? "—"}</td>
                    <td className="py-2 pr-4">{e.companyName ?? <span className="text-muted-foreground italic">—</span>}</td>
                    <td className="py-2 pr-4">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{emailTypeLabel(e.entityType)}</span>
                    </td>
                    <td className="py-2">{e.subject}</td>
                  </tr>
                ))}
                {data.recentEmails.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No emails sent yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Opted-out users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opted-out users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Company</th>
                  <th className="pb-2 font-medium">Opted out</th>
                </tr>
              </thead>
              <tbody>
                {data.optedOutUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4 font-medium">{u.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{u.email}</td>
                    <td className="py-2 pr-4">{u.companyName ?? <span className="text-muted-foreground italic">none</span>}</td>
                    <td className="py-2 text-muted-foreground">{timeAgo(u.updatedAt)}</td>
                  </tr>
                ))}
                {data.optedOutUsers.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No users have opted out</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
