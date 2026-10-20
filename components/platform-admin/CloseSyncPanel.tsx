"use client";

/**
 * The Close tab: whether this server syncs to Close at all, how far the sync has got
 * through the accounts and through Resend's mail, what Close refused, and the last
 * runs exactly as they were logged. "Run now" makes one run, the same one the schedule makes (lib/crm/schedule.ts).
 */
import { Contact, History, Mail, Play, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type RouterOutputs, trpc } from "@/lib/trpc/client";

type Status = RouterOutputs["platformAdmin"]["closeSync"];
type RunState = Status["runs"][number]["state"];
type Outcome = RouterOutputs["platformAdmin"]["runCloseSync"]["outcome"];

const when = (d: Date | string) => new Date(d).toLocaleString("de-DE");

type Headline = {
  readonly tone: "ok" | "off" | "failed";
  readonly text: string;
  /** The last run's log line, when it did not complete. */
  readonly log: string | null;
};

const LAST_RUN: Record<RunState, { tone: Headline["tone"]; verb: string }> = {
  completed: { tone: "ok", verb: "completed" },
  skipped: { tone: "off", verb: "was skipped" },
  failed: { tone: "failed", verb: "failed" },
};

/** One sentence on the state of the sync, from this server's settings and the latest run. */
function headline(s: Status): Headline {
  if (!s.setup.apiKey) {
    return {
      tone: "off",
      text: "Off: CLOSE_API_KEY is not set on this server.",
      log: null,
    };
  }
  if (!s.setup.deployedServer) {
    return {
      tone: "off",
      text: "Off: this is not a deployed production server (NODE_ENV, or a local NEXT_PUBLIC_APP_URL).",
      log: null,
    };
  }
  const last = s.runs[0];
  if (!last) {
    return {
      tone: "off",
      text: `On, but no run is logged yet. The first comes ${s.schedule.firstRunMinutes} minutes after the server starts.`,
      log: null,
    };
  }
  const { tone, verb } = LAST_RUN[last.state];
  return {
    tone,
    text: `The last run ${verb}, ${when(last.at)}.`,
    log: last.state === "completed" ? null : last.log,
  };
}

const TONE_CLASS: Record<Headline["tone"], string> = {
  ok: "border-green-300 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
  off: "border-border bg-muted/50 text-foreground",
  failed:
    "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
};

const STATE_BADGE: Record<RunState, { label: string; className: string }> = {
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  skipped: { label: "Skipped", className: "bg-muted text-muted-foreground" },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
};

const TOAST: Record<RunState, (message: string) => void> = {
  completed: (m) => toast.success(m),
  skipped: (m) => toast.warning(m),
  failed: (m) => toast.error(m),
};

function outcomeText(outcome: Outcome): string {
  if (!outcome.ok) return `The run threw: ${outcome.error}`;
  const r = outcome.result;
  if ("skipped" in r) return `Skipped: ${r.skipped}`;
  const counts = `created ${r.created}, linked ${r.linked}, updated ${r.updated}, refused ${r.refused}, ${r.invitesAdded} invitees added, ${r.mailNoted} mails logged, ${r.pending} still to do`;
  return r.stopped ? `Stopped: ${r.stopped} (${counts})` : `Done: ${counts}`;
}

function SettingRow({
  name,
  variable,
  set,
  unset,
  required,
}: {
  name: string;
  variable: string;
  set: boolean;
  unset: string;
  required: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border/50 py-2">
      <span>
        {name} <span className="font-mono text-xs text-muted-foreground">{variable}</span>
      </span>
      <span
        className={
          set
            ? "font-medium"
            : required
              ? "font-medium text-red-700 dark:text-red-300"
              : "text-muted-foreground"
        }
      >
        {set ? "Set" : unset}
      </span>
    </div>
  );
}

function FieldsRow({ fields }: { fields: Status["setup"]["fields"] }) {
  const synced = fields.filter((f) => f.set).length;
  return (
    <div className="space-y-2 py-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span>
          Fields{" "}
          <span className="font-mono text-xs text-muted-foreground">CLOSE_FIELD_IDS</span>
        </span>
        <span className={synced > 0 ? "font-medium" : "text-muted-foreground"}>
          {synced} of {fields.length} synced
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {fields.map((f) => (
          <span
            key={f.key}
            title={f.set ? "Synced" : "Not synced: no id set"}
            className={`rounded px-1.5 py-0.5 font-mono text-xs ${
              f.set ? "bg-muted font-medium" : "text-muted-foreground"
            }`}
          >
            {f.key}
          </span>
        ))}
      </div>
    </div>
  );
}

function SyncCard({ s }: { s: Status }) {
  const run = trpc.platformAdmin.runCloseSync.useMutation();
  const utils = trpc.useUtils();
  const head = headline(s);
  const { everyMinutes, firstRunMinutes, perRun } = s.schedule;

  const runNow = () => {
    if (
      !window.confirm(
        `Run one Close sync now? It writes up to ${perRun} people and up to ${s.schedule.mailPerRun} mails as emails on contacts in Close (it stops after two minutes).`,
      )
    ) {
      return;
    }
    run.mutate(undefined, {
      onSuccess: async ({ outcome, state }) => {
        await utils.platformAdmin.closeSync.invalidate();
        TOAST[state](outcomeText(outcome));
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Contact className="h-4 w-4" /> Close sync
          </CardTitle>
          <CardDescription>
            Three jobs in one run. First it adds everyone a user invited (colleagues and
            suppliers) as a contact on the inviter's lead. Then it keeps every verified
            account in Close (up to {perRun} people a run, newest signups first). Last it
            puts the emails Resend sent onto the recipients' contacts. Runs by itself
            every {everyMinutes} minutes, the first {firstRunMinutes} minutes after the
            server starts.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={runNow}
          disabled={run.isPending}
          data-testid="close-sync-run"
        >
          <Play className="h-4 w-4" /> {run.isPending ? "Running…" : "Run now"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className={`space-y-2 rounded-md border p-3 ${TONE_CLASS[head.tone]}`}>
          <p className="font-medium">{head.text}</p>
          {head.log && <p className="break-all font-mono text-xs">{head.log}</p>}
        </div>
        <div>
          <SettingRow
            name="API key"
            variable="CLOSE_API_KEY"
            set={s.setup.apiKey}
            unset="Missing"
            required
          />
          <SettingRow
            name="Deployed production server"
            variable="NODE_ENV, NEXT_PUBLIC_APP_URL"
            set={s.setup.deployedServer}
            unset="No"
            required
          />
          <SettingRow
            name="Status for new leads"
            variable="CLOSE_SIGNUP_STATUS_ID"
            set={s.setup.signupStatus}
            unset="Not set: Close's first status"
            required={false}
          />
          <SettingRow
            name="Suppressed status"
            variable="CLOSE_SUPPRESSED_STATUS_ID"
            set={s.setup.suppressedStatus}
            unset="Not set: objections are not read back"
            required={false}
          />
          <FieldsRow fields={s.setup.fields} />
          <SettingRow
            name="Resend key (needs permission to list mail)"
            variable="RESEND_API_KEY"
            set={s.setup.resendKey}
            unset="Not set: Resend mail is not sent to Close"
            required={false}
          />
          <SettingRow
            name="Newsletter mailbox"
            variable="RESEND_FROM_EMAIL_NEWS"
            set={s.setup.newsletterFrom}
            unset="Not set: newsletter issues are not recognised"
            required={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PeopleCard({ s }: { s: Status }) {
  const p = s.people;
  const figures = [
    { label: "Accounts to sync", value: p.accounts },
    { label: "In Close", value: p.inClose },
    { label: "Not yet in Close", value: Math.max(0, p.accounts - p.inClose) },
    { label: "Refused, retrying", value: p.retrying },
    { label: "Given up", value: p.gaveUp },
    { label: "Erasures queued", value: p.erasuresQueued },
    { label: "Invitees added", value: p.inviteesAdded },
    { label: "Invitees already there", value: p.inviteesKnown },
    { label: "Invitees refused", value: p.inviteesRefused },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" /> People
        </CardTitle>
        <CardDescription>
          Verified accounts without a disposable address. Last write to Close:{" "}
          {p.lastWriteAt ? when(p.lastWriteAt) : "never"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {figures.map((f) => (
            <div key={f.label}>
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className="text-2xl font-bold">{f.value}</dd>
            </div>
          ))}
        </dl>
        {s.refused.length > 0 && (
          <div>
            <p className="border-b pb-2 font-medium text-muted-foreground">
              Refused by Close, most recent first
            </p>
            <ul>
              {s.refused.map((r) => (
                <li
                  key={`${r.email}-${String(r.at)}`}
                  className="grid gap-1 border-b border-border/50 py-2 last:border-0 sm:grid-cols-[11rem_1fr_6rem_1fr] sm:gap-4"
                >
                  <span className="text-muted-foreground">{when(r.at)}</span>
                  <span className="break-all">{r.email}</span>
                  <span>
                    {r.refusals} {r.refusals === 1 ? "refusal" : "refusals"}
                  </span>
                  <span className="break-all font-mono text-xs">{r.error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MailCard({ s }: { s: Status }) {
  const m = s.mail;
  const figures = [
    { label: "Mails dealt with", value: m.handled },
    { label: "Entries in Close", value: m.notes },
    { label: "Mails in Close", value: m.noted },
    { label: "Nobody in Close", value: m.noContact },
    { label: "Not on the list", value: m.notListed },
    { label: "Not delivered", value: m.notDelivered },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" /> Resend mail
        </CardTitle>
        <CardDescription>
          Reads Resend's sent mail from the newest down and stops at the second mail it
          already dealt with. Newsletter issues and the welcome, signup follow-up and
          nudge mails are logged as emails on the recipient's contact, with sender,
          recipient, subject, text and send time; sign-in codes, invitations and alerts
          never are. Up to {s.schedule.mailPerRun} a run and two minutes, so the first 30
          days of history arrive over several runs. Mail that an earlier release logged as
          a one-line note is logged again as an email; those old notes stay in Close.{" "}
          {m.handled > 0 && m.oldest && m.newest
            ? `Covered so far: ${when(m.oldest)} to ${when(m.newest)}, last write ${m.lastAt ? when(m.lastAt) : "never"}.`
            : "Nothing dealt with yet."}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {figures.map((f) => (
            <div key={f.label}>
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className="text-2xl font-bold">{f.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function RunsCard({ s }: { s: Status }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" /> Recent runs
        </CardTitle>
        <CardDescription>
          Each run as it was logged, newest first. The same lines appear in the container
          log with the prefix [close].
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        {s.runs.length === 0 ? (
          <p className="text-muted-foreground">No run logged yet.</p>
        ) : (
          <ul>
            {s.runs.map((r) => (
              <li
                key={String(r.at)}
                className="grid gap-1 border-b border-border/50 py-2 last:border-0 sm:grid-cols-[11rem_6rem_1fr] sm:gap-4"
              >
                <span className="text-muted-foreground">{when(r.at)}</span>
                <span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATE_BADGE[r.state].className}`}
                  >
                    {STATE_BADGE[r.state].label}
                  </span>
                </span>
                <span className="break-all font-mono text-xs">{r.log}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function CloseSyncPanel() {
  const status = trpc.platformAdmin.closeSync.useQuery();
  const s = status.data;
  if (!s) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          {status.error ? status.error.message : "…"}
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <SyncCard s={s} />
      <PeopleCard s={s} />
      <MailCard s={s} />
      <RunsCard s={s} />
    </div>
  );
}
