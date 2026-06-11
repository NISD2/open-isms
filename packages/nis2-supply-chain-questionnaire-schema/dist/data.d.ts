import { type SupplierQuestionnaire } from "./schema";
/**
 * Source of truth lives in `src/fields/<section>.ts` (TypeScript with full
 * type safety on label, type, section, and Baustein IDs). The bundled JSON
 * artefact at `data/supply-chain-questionnaire.json` is generated from these
 * files via `bun run build:json` and shipped for non-TS consumers.
 *
 * Bump these constants when shipping a release; CI will fail if the
 * generated JSON falls out of sync.
 */
export declare const VERSION = "3.1.0";
export declare const LAST_UPDATED = "2026-05-15";
export declare const supplierQuestionnaire: SupplierQuestionnaire;
export declare function groupBySection(q: SupplierQuestionnaire): Map<string, {
    type: "string" | "boolean" | "text" | "email" | "phone" | "url" | "country" | "enum" | "integer";
    label: {
        en: string;
        de: string;
    };
    id: string;
    section: "profile" | "security_practices" | "saas_technical" | "on_prem_technical" | "pro_services" | "managed_services";
    description: {
        en: string;
        de: string;
    };
    legalBasis: string;
    required: boolean;
    options?: {
        value: string;
        label: {
            en: string;
            de: string;
        };
    }[] | undefined;
    visibleWhen?: {
        field: string;
        equals: string | number | boolean;
    } | undefined;
}[]>;
export declare function visibleFields(q: SupplierQuestionnaire, response: Record<string, unknown>): {
    type: "string" | "boolean" | "text" | "email" | "phone" | "url" | "country" | "enum" | "integer";
    label: {
        en: string;
        de: string;
    };
    id: string;
    section: "profile" | "security_practices" | "saas_technical" | "on_prem_technical" | "pro_services" | "managed_services";
    description: {
        en: string;
        de: string;
    };
    legalBasis: string;
    required: boolean;
    options?: {
        value: string;
        label: {
            en: string;
            de: string;
        };
    }[] | undefined;
    visibleWhen?: {
        field: string;
        equals: string | number | boolean;
    } | undefined;
}[];
//# sourceMappingURL=data.d.ts.map