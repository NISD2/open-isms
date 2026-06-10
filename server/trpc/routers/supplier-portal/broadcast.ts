/**
 * Supplier broadcast helper — fan-out incident notifications + invite emails.
 *
 * Broadcast state lives in `incident_broadcast` (one row per incident-customer
 * pair). The incident table itself stays generic; supplier-portal-specific
 * delivery state is isolated here.
 *
 * `broadcastIncidentBroadcast(broadcastId)` operates on a specific broadcast
 * row. The caller is expected to have created it (and verified ownership of
 * the parent incident) before calling. The cron path drains all pending
 * broadcasts indiscriminately — that's intentional, the broadcast table
 * itself is system-managed.
 */
import { eq, and, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { incident, supplier, company, incidentBroadcast } from "@/schema";
import {
  sendMail,
  supplierIncidentBroadcastEmail,
  supplierAddedYouEmail,
} from "@/lib/mail";
import { getAppUrl } from "@/lib/utils";

async function getSupplierName(supplierCompanyId: string): Promise<string> {
  const c = await db.query.company.findFirst({
    where: eq(company.id, supplierCompanyId),
    columns: { name: true },
  });
  return c?.name ?? "Supplier";
}

function accessUrl(token: string): string {
  return `${getAppUrl()}/supplier-access/${token}`;
}

function severityForEmail(severity: string): string {
  if (severity === "significant") return "critical";
  if (severity === "incident") return "warning";
  return "info";
}

/**
 * Drain a single broadcast row. Idempotent: only acts on rows in
 * status IN ('queued', 'failed'). Returns true iff an email was dispatched.
 */
export async function broadcastIncidentBroadcast(broadcastId: string): Promise<boolean> {
  const claimed = await db
    .update(incidentBroadcast)
    .set({ status: "sending" })
    .where(
      and(
        eq(incidentBroadcast.id, broadcastId),
        or(
          eq(incidentBroadcast.status, "queued"),
          eq(incidentBroadcast.status, "failed"),
        ),
      ),
    )
    .returning();

  const broadcast = claimed[0];
  if (!broadcast) return false;

  const evt = await db.query.incident.findFirst({
    where: eq(incident.id, broadcast.incidentId),
    columns: {
      id: true,
      title: true,
      description: true,
      severity: true,
      companyId: true,
      createdAt: true,
    },
  });
  if (!evt) {
    await db
      .update(incidentBroadcast)
      .set({ status: "failed", sentAt: new Date() })
      .where(eq(incidentBroadcast.id, broadcast.id));
    return false;
  }

  const rel = await db.query.supplier.findFirst({
    where: and(
      eq(supplier.id, broadcast.customerRelationshipId),
      eq(supplier.status, "active"),
    ),
    columns: { customerEmail: true, unsubscribeToken: true },
  });

  if (!rel || !rel.customerEmail || !rel.unsubscribeToken) {
    await db
      .update(incidentBroadcast)
      .set({ status: "sent", sentAt: new Date(), deliveryCount: 0 })
      .where(eq(incidentBroadcast.id, broadcast.id));
    return false;
  }

  const supplierName = await getSupplierName(evt.companyId);
  const link = accessUrl(rel.unsubscribeToken);

  const result = await sendMail({
    to: rel.customerEmail,
    ...supplierIncidentBroadcastEmail({
      supplierName,
      title: evt.title,
      body: evt.description ?? "",
      severity: severityForEmail(evt.severity),
      publishedAt: evt.createdAt,
      profileUrl: link,
      unsubscribeUrl: link,
    }),
  });

  await db
    .update(incidentBroadcast)
    .set({
      status: result.success ? "sent" : "failed",
      sentAt: new Date(),
      deliveryCount: result.success ? 1 : 0,
    })
    .where(eq(incidentBroadcast.id, broadcast.id));

  return result.success;
}

export async function notifyCustomerAdded(
  supplierCompanyId: string,
  customerEmail: string,
): Promise<void> {
  const rel = await db.query.supplier.findFirst({
    where: and(
      eq(supplier.supplierCompanyId, supplierCompanyId),
      eq(supplier.customerEmail, customerEmail.toLowerCase()),
    ),
    columns: { unsubscribeToken: true },
  });
  if (!rel || !rel.unsubscribeToken) return;

  const supplierName = await getSupplierName(supplierCompanyId);
  const link = accessUrl(rel.unsubscribeToken);

  const email = supplierAddedYouEmail({
    supplierName,
    profileUrl: link,
    unsubscribeUrl: link,
  });
  await sendMail({ to: customerEmail, ...email });
}

export async function drainQueuedBroadcasts(): Promise<{
  events: number;
  emails: number;
}> {
  const pending = await db.query.incidentBroadcast.findMany({
    where: or(
      eq(incidentBroadcast.status, "queued"),
      eq(incidentBroadcast.status, "failed"),
    ),
    columns: { id: true },
  });

  let totalEmails = 0;
  for (const p of pending) {
    if (await broadcastIncidentBroadcast(p.id)) totalEmails++;
  }
  return { events: pending.length, emails: totalEmails };
}
