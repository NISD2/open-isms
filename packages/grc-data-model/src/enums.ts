import { pgEnum } from "drizzle-orm/pg-core";

export const frameworkEnum = pgEnum("framework", [
  "nis2",
  "gdpr",
  "arbeitsschutz",
  "brandschutz",
  "iso27001",
  "bsi_grundschutz",
  "eu_ai_act",
  "eu_cra",
]);

export const entityTypeEnum = pgEnum("entity_type", [
  "essential",
  "important",
  "kritis",
]);

export const evidenceTypeEnum = pgEnum("evidence_type", [
  "document",
  "proof",
  "sign-off",
  "technical",
  "training",
]);

export const frequencyEnum = pgEnum("frequency", [
  "one-time",
  "monthly",
  "quarterly",
  "semi-annual",
  "annual",
  "every-3-years",
  "on-change",
  "ongoing",
]);

export const priorityEnum = pgEnum("priority", ["P0", "P1", "P2", "P3"]);

/**
 * The BSI's own grading of a control, in English.
 *
 *   required  Basis-Anforderung, printed "(B)" and worded MUSS. Not sizeable.
 *   expected  Standard-Anforderung, "(S)", SOLLTE. Meet it or record why not; this is where
 *             § 30 Abs. 1 S. 2 BSIG bites.
 *   optional  Anforderung bei erhöhtem Schutzbedarf, "(H)", KANN. Shown, never signed.
 *
 * The German words stay in the interface as the BSI's labels; identifiers are English.
 */
export const controlGradeEnum = pgEnum("control_grade", [
  "required",
  "expected",
  "optional",
]);

/**
 * Who a provision addresses, read off the statute's own wording rather than inferred.
 *
 *   all                    every entity in scope
 *   critical_installation  §§ 31 Abs. 2, 39 Abs. 1 BSIG
 *   service_type_60_1      § 34 BSIG, which points at the list in § 60 Abs. 1 Satz 1
 *   sector_35_2            § 35 Abs. 2 BSIG, which names five sectors
 *
 * § 60 Abs. 1 Satz 1 and § 30 Abs. 3 are two different lists that differ by two entries, so the
 * § 30 Abs. 3 question (which rulebook binds the areas) is answered separately and is not an
 * addressee.
 */
export const addresseeEnum = pgEnum("addressee", [
  "all",
  "critical_installation",
  "service_type_60_1",
  "sector_35_2",
]);

export const requirementImportanceEnum = pgEnum("requirement_importance", [
  "mandatory",
  "recommended",
  "enhanced",
]);

export const effortLevelEnum = pgEnum("effort_level", [
  "trivial",
  "light",
  "moderate",
  "significant",
  "major",
]);

export const incidentSeverityEnum = pgEnum("incident_severity", [
  "near_miss",
  "incident",
  "significant",
]);

export const situationColorEnum = pgEnum("situation_color", [
  "red",
  "orange",
  "yellow",
  "gray",
]);

export const supplierRelationshipTypeEnum = pgEnum("supplier_relationship_type", [
  "processor",
  "joint_controller",
  "separate_controller",
  "internal",
]);

export const supplierRiskLevelEnum = pgEnum("supplier_risk_level", [
  "critical",
  "high",
  "medium",
  "low",
]);

export const supplierAuditFrequencyEnum = pgEnum("supplier_audit_frequency", [
  "annual",
  "biennial",
  "on_change",
]);

export const supplierRelationshipStatusEnum = pgEnum("supplier_relationship_status", [
  "active",
  "revoked",
  "bounced",
]);

export const transferMechanismEnum = pgEnum("transfer_mechanism", [
  "adequacy",
  "sccs",
  "bcr",
  "derogation",
  "none",
]);

export const assetServiceTypeEnum = pgEnum("asset_service_type", [
  "saas",
  "on_prem",
  "pro_services",
  "managed",
]);

export const equivalenceKindEnum = pgEnum("equivalence_kind", [
  "equivalent",
  "overlapping",
]);
