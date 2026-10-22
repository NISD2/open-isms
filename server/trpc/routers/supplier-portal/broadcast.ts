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
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  sendMail,
  supplierAddedYouEmail,
  supplierIncidentBroadcastEmail,
} from "@/lib/mail";
import { getAppUrl } from "@/lib/utils";
import {
  company,
  incident,
  incidentBroadcast,
  supplier,
  supplierContact,
} from "@/schema";
import { recipientsOf } from "./contacts";

/** Raw as registered; the mail templates clean it and supply the fallback. */
async function getSupplierName(supplierCompanyId: string): Promise<string | null> {
  const c = await db.query.company.findFirst({
    where: eq(company.id, supplierCompanyId),
    columns: { name: true },
  });
  return c?.name ?? null;
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

  // No title or description: those are the supplier's own words, and the mail
  // carries none (lib/mail/templates.ts). The customer reads them behind the link.
  const evt = await db.query.incident.findFirst({
    where: eq(incident.id, broadcast.incidentId),
    columns: {
      id: true,
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
    columns: {
      id: true,
      customerCompanyId: true,
      customerEmail: true,
      unsubscribeToken: true,
    },
  });
  const recipients = rel ? await recipientsOf(db, rel) : [];

  if (!rel || recipients.length === 0) {
    await db
      .update(incidentBroadcast)
      .set({ status: "sent", sentAt: new Date(), deliveryCount: 0 })
      .where(eq(incidentBroadcast.id, broadcast.id));
    return false;
  }

  const supplierName = await getSupplierName(evt.companyId);

  // One mail per person, each with that person's own link. A failed render counts as a failed
  // send for that person.
  const sent = await Promise.all(
    recipients.map((recipient) => {
      const link = accessUrl(recipient.token);
      return supplierIncidentBroadcastEmail({
        supplierName,
        severity: severityForEmail(evt.severity),
        publishedAt: evt.createdAt,
        // The anchor SharedIncidentsSection gives each notice on the access page.
        incidentUrl: `${link}#incident-${evt.id}`,
        unsubscribeUrl: link,
      })
        .then((content) =>
          sendMail({
            // External recipient: consent lives with the portal's own token
            // (supplier.unsubscribedAt), checked when the relationship is selected.
            emailType: "supplier.incident_broadcast",
            to: recipient.email,
            ...content,
          }),
        )
        .then((result) => result.success)
        .catch(() => false);
    }),
  );
  // Failed only when nobody got it: the drain retries a failed row, and a retry after a partial
  // success would send the notice twice to the people it already reached.
  const delivered = sent.filter(Boolean).length;

  await db
    .update(incidentBroadcast)
    .set({
      status: delivered > 0 ? "sent" : "failed",
      sentAt: new Date(),
      deliveryCount: delivered,
    })
    .where(eq(incidentBroadcast.id, broadcast.id));

  return delivered > 0;
}

/** The "added you" mail: who the supplier is and the link this person holds. */
async function sendAddedYouMail(
  supplierCompanyId: string,
  to: string,
  token: string,
): Promise<void> {
  const supplierName = await getSupplierName(supplierCompanyId);
  const link = accessUrl(token);
  const email = await supplierAddedYouEmail({
    supplierName,
    profileUrl: link,
    unsubscribeUrl: link,
  });
  await sendMail({ emailType: "supplier.added_you", to, ...email });
}

/** The customer's first contact, the address on the row, is told it was added. */
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
  if (!rel?.unsubscribeToken) return;
  await sendAddedYouMail(supplierCompanyId, customerEmail, rel.unsubscribeToken);
}

/** One more person at a customer is sent their own link. */
export async function notifyContactAdded(contactId: string): Promise<void> {
  const contact = await db.query.supplierContact.findFirst({
    where: eq(supplierContact.id, contactId),
    columns: { email: true, accessToken: true, relationshipId: true },
  });
  if (!contact) return;
  const rel = await db.query.supplier.findFirst({
    where: eq(supplier.id, contact.relationshipId),
    columns: { supplierCompanyId: true },
  });
  if (!rel?.supplierCompanyId) return;
  await sendAddedYouMail(rel.supplierCompanyId, contact.email, contact.accessToken);
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
