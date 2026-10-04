// Source of truth for the supplier questionnaire fields in this section.
// Edit this file (not data/supply-chain-questionnaire.json) and run
// `bun run build:json` to regenerate the published JSON artefact.
//
// Encryption is asked of every supplier that holds customer data, in
// ./security-practices.ts, not only of software as a service.

import type { SupplierField } from "../schema";
import { SAAS } from "./gates";

export const saasTechnicalFields: SupplierField[] = [
  {
    id: "saasMfaEnforced",
    section: "saas_technical",
    type: "boolean",
    label: {
      en: "Customers can protect their accounts with a second factor",
      de: "Kunden können ihre Konten mit einem zweiten Faktor schützen",
    },
    description: {
      en: "Tick yes if your application offers sign-in with a second factor (an authenticator app, a security key or a one-time code), at least for your customers' administrators. Your own internal admin accounts are a separate question under security practices.",
      de: "Ja, wenn Ihre Anwendung eine Anmeldung mit zweitem Faktor anbietet (App, Sicherheitsschlüssel oder Einmalcode), mindestens für die Administratoren Ihrer Kunden. Ihre eigenen internen Administratorkonten fragt ein eigener Punkt unter Sicherheit im Betrieb ab.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(c); §11.7",
    iso27001: ["A.8.5", "A.5.23"],
    required: true,
    visibleWhen: SAAS,
  },
  {
    id: "saasRtoHours",
    section: "saas_technical",
    type: "integer",
    label: {
      en: "Longest outage until your service is restored (hours)",
      de: "Längste Ausfallzeit bis zur Wiederherstellung (Stunden)",
    },
    description: {
      en: "The most hours your service may be unavailable before it is restored. Give a value you keep.",
      de: "So viele Stunden darf Ihr Dienst höchstens ausfallen, bis er wiederhergestellt ist. Nennen Sie einen Wert, den Sie halten.",
    },
    legalBasis: "ENISA TIG §5.1 TIPS",
    iso27001: ["A.5.30", "A.5.23"],
    required: true,
    visibleWhen: SAAS,
  },
];
