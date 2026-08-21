/**
 * End-to-end smoke test for the supplier portal (v2 — bilateral, no public profile).
 *
 * Walks the full flow as the seed user:
 *   1. profile.upsert            — create the supplier profile
 *   2. profile.saveQuestionnaire — save the BSI/CIR answers
 *   3. relationship.invite       — invite a customer (status = active immediately)
 *   4. incident.publish          — publish a test incident scoped to the relationship
 *   5. public.revoke             — customer revokes access via their token
 *
 * Run: bun run scripts/smoke-supplier-portal.ts
 *
 * The test writes to DATABASE_URL and refuses to run against anything but a
 * local database — see assertLocalDatabase below. Idempotent: re-running
 * cleans up the test relationship.
 */
import { eq } from "drizzle-orm";
import * as schema from "@/schema";
import { createCallerFactory, type TRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";
import { db as appDb } from "@/lib/db";
import { env } from "@/lib/env";

const TEST_CUSTOMER_EMAIL = "smoke-test-ciso@example.test";

const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * Step 2 overwrites the seed company's legal identity, address, BSI
 * registration id and security-practice flags with test values, and
 * cleanupTestData restores none of it. Pointed at production that is silent
 * customer-data corruption, so refuse anything that is not a local database.
 *
 * Connection-shaped rather than a boolean env flag, for the same reason as
 * assertE2eTargets() in e2e/lib/env.ts: a flag can be set once and forgotten,
 * a host cannot.
 */
function assertLocalDatabase(): void {
  const { hostname } = new URL(env.DATABASE_URL);
  if (!LOCAL_DB_HOSTS.has(hostname)) {
    throw new Error(
      `Refusing to run: DATABASE_URL host "${hostname}" is not a local database. ` +
        `This script overwrites the first company row it finds and does not restore it. ` +
        `Point DATABASE_URL at a local dev database and re-run.`,
    );
  }
}

async function getSeedUser() {
  const user = await appDb.query.user.findFirst({
    where: (u, { isNotNull }) => isNotNull(u.companyId),
  });
  if (!user || !user.companyId) {
    throw new Error("No seed user found. Run `bun db:seed` first.");
  }
  const seedCompany = await appDb.query.company.findFirst({
    where: eq(schema.company.id, user.companyId),
    columns: { activatedAt: true },
  });
  return {
    id: user.id,
    companyId: user.companyId,
    email: user.email,
    companyActivated: seedCompany?.activatedAt != null,
  };
}

async function cleanupTestData(companyId: string) {
  // Drop the test relationship and reset the seed company back to "not yet a
  // supplier" so the next run starts from a clean slate. This lets the smoke
  // test verify the unblock flow: a fresh company should be able to call
  // profile.get and saveQuestionnaire / upsert without any prior state.
  await appDb
    .delete(schema.supplier)
    .where(eq(schema.supplier.customerEmail, TEST_CUSTOMER_EMAIL));
  await appDb
    .update(schema.company)
    .set({ actsAsSupplier: false })
    .where(eq(schema.company.id, companyId));
}

async function main() {
  assertLocalDatabase();

  console.log("=== Supplier Portal smoke test ===\n");

  const user = await getSeedUser();
  console.log(`Seed user: ${user.email} (company ${user.companyId})`);

  // Build a tRPC caller with the seed user's context. Typing it as the real
  // TRPCContext keeps the caller honest about what the procedure ladder reads
  // (session.role, userId, companyId) instead of asserting past it.
  const createCaller = createCallerFactory(appRouter);
  const ctx: TRPCContext = {
    db: appDb,
    session: {
      user: { id: user.id, name: "Smoke Test", email: user.email },
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      role: "admin",
      companyId: user.companyId,
      companyActivated: user.companyActivated,
      jobTitle: null,
      sessionVersion: null,
    },
    userId: user.id,
    companyId: user.companyId,
    ip: "smoke-test",
    userAgent: null,
  };
  const caller = createCaller(ctx);

  // Cleanup from any previous run — also resets actsAsSupplier=false so the
  // next test starts from a fresh "not yet opted in" state.
  await cleanupTestData(user.companyId);
  console.log("✓ Cleanup done (actsAsSupplier reset to false)\n");

  // ---------------------------------------------------------------------
  // 0. Verify the unblock: profile.get must return a row even when
  //    actsAsSupplier=false (so the questionnaire/profile pages render).
  //    Verify that requireSupplierRole still gates invite/incident.
  // ---------------------------------------------------------------------
  console.log("0. unblock + role-flag gate checks");
  const beforeAnySave = await caller.supplierPortal.profile.get();
  if (!beforeAnySave) throw new Error("profile.get returned null on fresh company");
  if (beforeAnySave.actsAsSupplier !== false) {
    throw new Error("expected actsAsSupplier=false after reset");
  }
  console.log("   ✓ profile.get returns row with actsAsSupplier=false");

  // The role-flag gate must reject invites until the supplier saves something
  let inviteBlocked = false;
  try {
    await caller.supplierPortal.relationship.invite({
      customerEmail: "should-not-create@example.test",
      source: "manual",
    });
  } catch (err) {
    if ((err as { code?: string }).code === "FORBIDDEN") inviteBlocked = true;
  }
  if (!inviteBlocked) {
    throw new Error("relationship.invite should have been FORBIDDEN before any save");
  }
  console.log("   ✓ relationship.invite is FORBIDDEN before any save\n");

  // ---------------------------------------------------------------------
  // 1. Save profile metadata (subset of the company-level security profile)
  // ---------------------------------------------------------------------
  console.log("1. profile.save (metadata)");
  const profile = await caller.supplierPortal.profile.save({
    primaryDomain: "smoke-test.example",
    tagline: "Smoke test supplier",
    incidentContactEmail: "incidents@smoke-test.example",
  });
  console.log(`   ✓ profile id=${profile.id} actsAsSupplier=${profile.actsAsSupplier}\n`);

  // ---------------------------------------------------------------------
  // 2. Save the security practices subset (also via profile.save)
  //
  // Service-type flags + branch-specific fields moved to the asset table.
  // Per-customer contract clauses moved to the supplier (relationship) table.
  // Only universal company truths are saved here.
  // ---------------------------------------------------------------------
  console.log("2. profile.save (security practices)");
  const saved = await caller.supplierPortal.profile.save({
    legalName: "Smoke Test GmbH",
    registeredAddress: "Teststraße 1, 12345 Berlin",
    country: "DE",
    securityContactName: "Bob Sec",
    hasIsms: true,
    hasIso27001OrEquivalent: true,
    staffSecurityTraining: true,
    backgroundChecks: true,
    vulnerabilityHandling: true,
    // NIS2 Art 21(2) / CIR §5.1 universal baseline practices
    securityPolicyReviewedAnnually: true,
    hasIncidentResponsePlan: true,
    hasBusinessContinuityPlan: true,
    hasCryptographyPolicy: true,
    hasPrivilegedAccessMgmt: true,
    mfaEnforcedInternal: true,
    hasAssetInventory: true,
    hasPenetrationTestingProgram: true,
    // ENISA TIG §5 — universal company-wide declarations
    cooperateWithAuthorities: true,
    pastBreachesDisclosed: true,
    bsiRegistrationId: "BSI-NIS2-2026-SMOKE",
  });
  console.log(`   ✓ saved at ${saved.practicesLastSavedAt?.toISOString()}\n`);

  // ---------------------------------------------------------------------
  // 3. Invite a customer (status = active immediately, no double opt-in)
  // ---------------------------------------------------------------------
  console.log("3. relationship.invite");
  const invited = await caller.supplierPortal.relationship.invite({
    customerEmail: TEST_CUSTOMER_EMAIL,
    customerOrgName: "Smoke Test Customer GmbH",
    source: "manual",
  });
  console.log(`   ✓ relationship id=${invited.id} status=${invited.status}\n`);

  // ---------------------------------------------------------------------
  // 3b. Save per-customer contract clauses on the relationship row
  // ---------------------------------------------------------------------
  console.log("3b. relationship.updateClauses");
  const clausesUpdated = await caller.supplierPortal.relationship.updateClauses({
    id: invited.id,
    acceptRightToAudit: true,
    hasSubprocessors: false,
    dataReturnOnTermination: true,
    dpaAvailable: true,
    notifyOnLocationChange: true,
    incidentAssistanceCommitment: true,
    notifyMaterialChanges: true,
    hasExitPlan: true,
    incidentSlaHours: 24,
  });
  console.log(
    `   ✓ clauses incidentSlaHours=${clausesUpdated.incidentSlaHours}h auditOk=${clausesUpdated.acceptRightToAudit}\n`,
  );

  // ---------------------------------------------------------------------
  // 4. Publish an incident scoped to this relationship
  // ---------------------------------------------------------------------
  console.log("4. incident.publish");
  const incident = await caller.supplierPortal.incident.publish({
    relationshipId: invited.id,
    title: "Smoke test incident",
    body: "This is a smoke test incident notification. No action required.",
    severity: "info",
  });
  console.log(`   ✓ event id=${incident.id}`);
  console.log("   (sync broadcast triggered fire-and-forget)\n");

  // Give the async fan-out a moment, then check the broadcast state.
  await new Promise((r) => setTimeout(r, 1500));
  const broadcastRow = await appDb.query.incidentBroadcast.findFirst({
    where: eq(schema.incidentBroadcast.incidentId, incident.id),
  });
  console.log(
    `   broadcastStatus=${broadcastRow?.status} count=${broadcastRow?.deliveryCount}\n`,
  );

  // ---------------------------------------------------------------------
  // 5. Add a managed asset for the invited customer (full service profile)
  //
  // This is now a full asset row with serviceType + branch fields. The
  // customer sees it via /supplier-access/{token} and uses the technical
  // declarations as evidence in their own NIS2 supplier-monitoring controls.
  // ---------------------------------------------------------------------
  console.log("5. managedAsset.create (with service profile)");
  const asset = await caller.supplierPortal.managedAsset.create({
    relationshipId: invited.id,
    name: "Production CRM",
    description: "Hosted CRM instance for the customer's sales team",
    serviceType: "saas",
    serviceDescription:
      "Multi-tenant SaaS CRM hosted in eu-central-1, EU-only data residency.",
    dataProcessingLocations: "DE, AT",
    hasMfa: true,
    encryptionAtRest: "AES-256-GCM",
    encryptionInTransit: "TLS_AES_256_GCM_SHA384",
    rto: 4,
    saasHostingRegion: "eu",
  });
  console.log(`   ✓ asset id=${asset.id} name="${asset.name}"\n`);

  // ---------------------------------------------------------------------
  // 6. Customer fetches their token-gated view
  // ---------------------------------------------------------------------
  console.log("6. public.getByToken (customer view)");
  const rel = await appDb.query.supplier.findFirst({
    where: eq(schema.supplier.customerEmail, TEST_CUSTOMER_EMAIL),
    columns: { unsubscribeToken: true },
  });
  if (!rel || !rel.unsubscribeToken) throw new Error("Relationship missing after invite");
  const accessToken = rel.unsubscribeToken;
  const view = await caller.supplierPortal.public.getByToken({
    token: accessToken,
  });
  if (!view) throw new Error("Customer access view returned null");
  console.log(
    `   ✓ supplier=${view.supplierCompany?.name ?? "?"} assets=${view.managedAssets.length} events=${view.recentEvents.length}\n`,
  );

  // ---------------------------------------------------------------------
  // 7. Customer revokes access via their token
  // ---------------------------------------------------------------------
  console.log("7. public.revoke");
  await caller.supplierPortal.public.revoke({ token: accessToken });
  const revoked = await appDb.query.supplier.findFirst({
    where: eq(schema.supplier.customerEmail, TEST_CUSTOMER_EMAIL),
    columns: { status: true },
  });
  console.log(`   ✓ status=${revoked?.status}\n`);

  // After revoke, getByToken must return null
  const afterRevoke = await caller.supplierPortal.public.getByToken({
    token: accessToken,
  });
  if (afterRevoke !== null) {
    throw new Error("getByToken should return null for revoked relationships");
  }
  console.log(`   ✓ getByToken returns null for revoked tokens\n`);

  console.log("=== ALL STEPS PASSED ===");

  // Final cleanup
  await cleanupTestData(user.companyId);
  console.log("Cleanup done.");

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ SMOKE TEST FAILED:");
  console.error(err);
  process.exit(1);
});
