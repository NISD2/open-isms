/**
 * The requirement copy: one namespace, `requirements`, stored in parts, one per framework, so each
 * framework keeps its own copy and no file outgrows what a reader holds at once
 * (scripts/check-file-size.ts). ISO 27001 is split into its clauses and its four Annex A themes.
 *
 *   messages/requirements/<part>/<locale>.json  { "requirements": { "<code>": { title, description } } }
 *
 * Readers still see one namespace: next-intl through i18n/request.ts, server code through
 * lib/messages.ts, and the English bundle below. A language may lack a part (es and it have no AI
 * Act or CRA copy); English fills it.
 */

import euAiAct from "@/messages/requirements/eu-ai-act/en.json";
import euCra from "@/messages/requirements/eu-cra/en.json";
import gdpr from "@/messages/requirements/gdpr/en.json";
import iso27001A5 from "@/messages/requirements/iso27001-a5/en.json";
import iso27001A6 from "@/messages/requirements/iso27001-a6/en.json";
import iso27001A7 from "@/messages/requirements/iso27001-a7/en.json";
import iso27001A8 from "@/messages/requirements/iso27001-a8/en.json";
import iso27001Clauses from "@/messages/requirements/iso27001-clauses/en.json";
import nis2 from "@/messages/requirements/nis2/en.json";
import { isMissingModule } from "./missing-module";

const ENGLISH = {
  nis2,
  gdpr,
  "eu-ai-act": euAiAct,
  "eu-cra": euCra,
  "iso27001-clauses": iso27001Clauses,
  "iso27001-a5": iso27001A5,
  "iso27001-a6": iso27001A6,
  "iso27001-a7": iso27001A7,
  "iso27001-a8": iso27001A8,
} as const;

export type RequirementPart = keyof typeof ENGLISH;

export const REQUIREMENT_PARTS = Object.keys(ENGLISH) as readonly RequirementPart[];

/** A requirement's message key: its code with dots as underscores ("5.1" is "5_1"). */
export type RequirementKey = {
  [P in RequirementPart]: keyof (typeof ENGLISH)[P]["requirements"];
}[RequirementPart];

export interface RequirementCopy {
  readonly title: string;
  readonly description: string;
}

export interface RequirementsMessages {
  readonly requirements: Readonly<Record<RequirementKey, RequirementCopy>>;
}

/** Every part's English copy. The type requires every key of every part, so a part left out here fails to compile. */
export const requirementsEn: RequirementsMessages = {
  requirements: {
    ...nis2.requirements,
    ...gdpr.requirements,
    ...euAiAct.requirements,
    ...euCra.requirements,
    ...iso27001Clauses.requirements,
    ...iso27001A5.requirements,
    ...iso27001A6.requirements,
    ...iso27001A7.requirements,
    ...iso27001A8.requirements,
  },
};

type Messages = Record<string, unknown>;

const isRecord = (value: unknown): value is Messages =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** One language's parts merged into the namespace. Codes are unique across parts. */
export const mergeRequirementParts = (parts: readonly unknown[]): Messages => ({
  requirements: Object.fromEntries(
    parts.flatMap((part) =>
      isRecord(part) && isRecord(part.requirements)
        ? Object.entries(part.requirements)
        : [],
    ),
  ),
});

/**
 * One language's requirement copy, from the parts it has. A part with no file in that language is
 * left out for English to fill; any other failure, such as malformed JSON, is thrown.
 */
export const loadRequirements = async (locale: string): Promise<Messages> =>
  mergeRequirementParts(
    await Promise.all(
      REQUIREMENT_PARTS.map((part) =>
        import(`../messages/requirements/${part}/${locale}.json`).then(
          (module: { readonly default: unknown }) => module.default,
          (error: unknown) => {
            if (isMissingModule(error)) return {};
            throw error;
          },
        ),
      ),
    ),
  );
