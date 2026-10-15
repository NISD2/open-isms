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
      cs: "Zákazníci si mohou chránit své účty druhým faktorem",
    },
    description: {
      en: "Tick yes if your application offers sign-in with a second factor (an authenticator app, a security key or a one-time code), at least for your customers' administrators. Your own internal admin accounts are a separate question under security practices.",
      de: "Ja, wenn Ihre Anwendung eine Anmeldung mit zweitem Faktor anbietet (App, Sicherheitsschlüssel oder Einmalcode), mindestens für die Administratoren Ihrer Kunden. Ihre eigenen internen Administratorkonten fragt ein eigener Punkt unter Sicherheit im Betrieb ab.",
      cs: "Ano, pokud vaše aplikace nabízí přihlášení s druhým faktorem (ověřovací aplikace, bezpečnostní klíč nebo jednorázový kód), alespoň pro administrátory vašich zákazníků. Na vaše vlastní interní administrátorské účty se ptá samostatná otázka v části o bezpečnostní praxi.",
    },
    legalBasis: "CIR 2024/2690 §5.1.2(c); §11.7",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.2 písm. c); bod 11.7",
    },
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
      cs: "Nejdelší výpadek do obnovení služby (hodiny)",
    },
    description: {
      en: "The most hours your service may be unavailable before it is restored. Give a value you keep.",
      de: "So viele Stunden darf Ihr Dienst höchstens ausfallen, bis er wiederhergestellt ist. Nennen Sie einen Wert, den Sie halten.",
      cs: "Nejvyšší počet hodin, po který smí být vaše služba nedostupná, než ji obnovíte. Uveďte hodnotu, kterou dodržíte.",
    },
    legalBasis: "ENISA TIG §5.1 TIPS",
    legalBasisLocalised: {
      cs: "ENISA TIG, oddíl 5.1, tipy",
    },
    iso27001: ["A.5.30", "A.5.23"],
    required: true,
    visibleWhen: SAAS,
  },
];
