/**
 * NIS2 Compliance Platform — Schema barrel.
 *
 * Single import point for everything:
 *   import { company, entityTypeEnum, type Company } from "@/schema";
 *   import { companyInsertSchema } from "@/schema/validators";
 *
 * Layered:
 *   - @nisd2/grc-data-model — entity model (framework, requirement, supplier, asset, risk, incident)
 *   - @nisd2/isms-schema    — ISMS-process tables (audit-log, evidence, sign-off, policies, training, etc.)
 *   - schema/tables/*       — SaaS-only tables (leads, email-otp, company-invite, supplier-invite, supplier-portal)
 *   - schema/modules/*      — framework-specific extensions (bsig)
 */

// GRC-core: entity model
export * from "@nisd2/grc-data-model/enums";
export * from "@nisd2/grc-data-model/schema";

// ISMS-process: extracted to its own package (includes enums)
export * from "@nisd2/isms-schema";

// SaaS-only tables — stay at NIS2 root
export * from "./tables/leads";
export * from "./tables/email-otp";
export * from "./tables/company-invite";
export * from "./tables/supplier-invite";
export * from "./tables/supplier-portal";
export * from "./tables/newsletter-group";
export * from "./tables/newsletter-issue";
export * from "./tables/data-erasure-log";

// Modules (framework-specific extensions)
export * from "./modules/bsig";

// Relations (required for Drizzle relational queries)
export * from "./relations";

// Types
export * from "./types";
