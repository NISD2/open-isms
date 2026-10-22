/**
 * Supplier Portal — combined tRPC router.
 *
 * Self-contained folder. Nothing outside `server/trpc/routers/supplier-portal/`
 * imports from inside. The only modification to existing code is two lines in
 * `server/trpc/router.ts` (one import, one registration).
 *
 * Routers are namespaced under `supplierPortal.*` in the appRouter, e.g.:
 *   trpc.supplierPortal.profile.get.useQuery()
 *   trpc.supplierPortal.profile.saveQuestionnaire.useMutation()
 *   trpc.supplierPortal.public.getByToken.useQuery({ token })
 *
 * The questionnaire columns live directly on supplier_profile and are saved
 * via profile.saveQuestionnaire — no separate form_template / form_response
 * infrastructure.
 */
import { router } from "../../init";
import { companyCertificationRouter } from "./certification";
import { supplierContactRouter } from "./contact-router";
import { supplierIncidentRouter } from "./incident";
import { supplierManagedAssetRouter } from "./managed-asset";
import { supplierOnboardingRouter } from "./onboarding";
import { supplierProfileRouter } from "./profile";
import { supplierPublicRouter } from "./public";
import { supplierRelationshipRouter } from "./relationship";

export const supplierPortalRouter = router({
  // Supplier-only signup path (creates company with actsAsSupplier=true)
  onboarding: supplierOnboardingRouter,

  // Supplier-side (the supplier managing their own profile + questionnaire)
  profile: supplierProfileRouter,
  relationship: supplierRelationshipRouter,
  // The people at a customer who hold a link: list, add, remove
  contact: supplierContactRouter,
  managedAsset: supplierManagedAssetRouter,
  // Cert table is generic (company_certification) but the supplier portal is
  // currently the only consumer — keep the namespace stable for the client.
  certification: companyCertificationRouter,
  incident: supplierIncidentRouter,

  // Token-gated customer access (no auth)
  public: supplierPublicRouter,
});
