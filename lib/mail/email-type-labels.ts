/**
 * Human names for the email catalogue, for the preference centre and the
 * in-app settings page. Kept beside the registry rather than in the next-intl
 * message files because the preference centre is reachable without a session
 * (straight from an email link, outside the [locale] segment) and so has no
 * request locale to read — the language rides in the URL instead.
 *
 * de / en / nl only, matching the languages our email copy exists in.
 */
import type { EmailCategory, UserConsentEmailTypeId } from "./email-types";
import { EMAIL_LOCALES, type EmailLocale } from "./locale";

/**
 * Alias of EmailLocale. The preference centre and the mail templates answer the
 * same question — which of the three languages our email copy exists in — and
 * used to declare the union twice, so a fourth language would have had to be
 * added in two places to take effect in both.
 */
export type PreferenceLocale = EmailLocale;

export const PREFERENCE_LOCALES: readonly PreferenceLocale[] = EMAIL_LOCALES;

export function parsePreferenceLocale(raw: string | null | undefined): PreferenceLocale {
  return raw === "en" || raw === "nl" ? raw : "de";
}

interface Label {
  title: string;
  description: string;
}

export const CATEGORY_LABELS: Record<EmailCategory, Record<PreferenceLocale, Label>> = {
  security: {
    de: {
      title: "Sicherheit und Anmeldung",
      description:
        "Anmeldecodes, Passwort zurücksetzen, Hinweise zu Änderungen an Ihrem Konto. Diese senden wir immer.",
    },
    en: {
      title: "Security and sign-in",
      description:
        "Sign-in codes, password resets, notices about changes to your account. These are always sent.",
    },
    nl: {
      title: "Beveiliging en aanmelden",
      description:
        "Aanmeldcodes, wachtwoordherstel, meldingen over wijzigingen in uw account. Deze sturen we altijd.",
    },
  },
  account: {
    de: {
      title: "Konto",
      description:
        "Einladungen in ein Unternehmen und Änderungen an Ihrer Mitgliedschaft. Diese senden wir immer.",
    },
    en: {
      title: "Account",
      description:
        "Invitations to a company and changes to your membership. These are always sent.",
    },
    nl: {
      title: "Account",
      description:
        "Uitnodigingen voor een bedrijf en wijzigingen in uw lidmaatschap. Deze sturen we altijd.",
    },
  },
  work: {
    de: {
      title: "Zuweisungen und Freigaben",
      description:
        "Wenn Ihnen jemand einen Bereich zuweist oder eine Freigabe entscheidet.",
    },
    en: {
      title: "Assignments and reviews",
      description: "When someone assigns you an area or decides on a review.",
    },
    nl: {
      title: "Toewijzingen en beoordelingen",
      description: "Wanneer iemand u een gebied toewijst of een beoordeling afrondt.",
    },
  },
  reminders: {
    de: {
      title: "Erinnerungen an Fristen",
      description:
        "Die tägliche Übersicht offener Punkte und der Wochenbericht für die Leitung.",
    },
    en: {
      title: "Deadline reminders",
      description:
        "The daily summary of open items and the weekly report for management.",
    },
    nl: {
      title: "Herinneringen aan deadlines",
      description:
        "Het dagelijkse overzicht van openstaande punten en het weekrapport voor de leiding.",
    },
  },
  product: {
    de: {
      title: "Hinweise zur Nutzung",
      description:
        "Gelegentliche Hinweise, wenn ein Kurs oder Ihr Umsetzungspfad liegen bleibt.",
    },
    en: {
      title: "Product nudges",
      description:
        "Occasional pointers when a course or your implementation path stalls.",
    },
    nl: {
      title: "Gebruikstips",
      description:
        "Af en toe een tip wanneer een cursus of uw implementatiepad stilligt.",
    },
  },
  newsletter: {
    de: {
      title: "Newsletter",
      description: "Was sich bei NIS 2 und in der Plattform getan hat.",
    },
    en: {
      title: "Newsletter",
      description: "What has changed in NIS 2 and in the platform.",
    },
    nl: {
      title: "Nieuwsbrief",
      description: "Wat er is veranderd in NIS 2 en in het platform.",
    },
  },
  // Not shown in the centre: no account holder can switch these off there.
  supplier: {
    de: { title: "Lieferkette", description: "" },
    en: { title: "Supply chain", description: "" },
    nl: { title: "Toeleveringsketen", description: "" },
  },
  internal: {
    de: { title: "Intern", description: "" },
    en: { title: "Internal", description: "" },
    nl: { title: "Intern", description: "" },
  },
};

export const TYPE_LABELS: Record<
  UserConsentEmailTypeId,
  Record<PreferenceLocale, string>
> = {
  "work.category_assigned": {
    de: "Ein Bereich wurde mir zugewiesen",
    en: "An area was assigned to me",
    nl: "Een gebied is aan mij toegewezen",
  },
  "work.category_unassigned": {
    de: "Eine Zuweisung wurde aufgehoben",
    en: "An assignment was removed",
    nl: "Een toewijzing is ingetrokken",
  },
  "work.review_decision": {
    de: "Entscheidung über eine Freigabe",
    en: "Decision on a review",
    nl: "Besluit over een beoordeling",
  },
  "reminders.daily_digest": {
    de: "Tägliche Übersicht offener Punkte",
    en: "Daily summary of open items",
    nl: "Dagelijks overzicht van openstaande punten",
  },
  "reminders.weekly_management_digest": {
    de: "Wochenbericht für die Leitung",
    en: "Weekly report for management",
    nl: "Weekrapport voor de leiding",
  },
  "product.course_followup": {
    de: "Nachfrage zu einem begonnenen Kurs",
    en: "Follow-up on a course you started",
    nl: "Navraag over een gestarte cursus",
  },
  "product.lifecycle_nudge": {
    de: "Hinweis auf den nächsten Schritt im Umsetzungspfad",
    en: "Pointer to your next step on the implementation path",
    nl: "Tip over uw volgende stap op het implementatiepad",
  },
  "newsletter.issue": {
    de: "Newsletter-Ausgaben",
    en: "Newsletter issues",
    nl: "Nieuwsbriefedities",
  },
};

export const PAGE_COPY: Record<
  PreferenceLocale,
  {
    title: string;
    intro: string;
    /**
     * Phrased as what ticking the box DOES, because every switch on the page
     * means "ticked = you receive it". A label that said "unsubscribe from
     * everything" on a box that means "subscribed" is how people leave when
     * they meant to stay, or the reverse.
     */
    allOnTitle: string;
    allOnDescription: string;
    alwaysSent: string;
    saved: string;
    failed: string;
    invalid: string;
    invalidHelp: string;
  }
> = {
  de: {
    title: "E-Mail-Einstellungen",
    intro:
      "Wählen Sie, welche E-Mails Sie von nisd2.eu erhalten. Änderungen gelten sofort.",
    allOnTitle: "Optionale E-Mails erhalten",
    allOnDescription:
      "Abwählen heißt: nur noch das Nötigste, also Anmeldecodes, Sicherheitshinweise und Kontoänderungen.",
    alwaysSent: "Wird immer gesendet",
    saved: "Gespeichert",
    failed: "Konnte nicht gespeichert werden. Bitte erneut versuchen.",
    invalid: "Dieser Link ist nicht mehr gültig",
    invalidHelp:
      "Der Link wurde vermutlich beim Kopieren abgeschnitten. Schreiben Sie uns, dann stellen wir es ein.",
  },
  en: {
    title: "Email settings",
    intro: "Choose which emails you get from nisd2.eu. Changes take effect immediately.",
    allOnTitle: "Receive optional emails",
    allOnDescription:
      "Unticking this keeps only the essentials: sign-in codes, security notices and account changes.",
    alwaysSent: "Always sent",
    saved: "Saved",
    failed: "Could not save. Please try again.",
    invalid: "This link is no longer valid",
    invalidHelp:
      "The link was probably cut off when it was copied. Write to us and we will set it for you.",
  },
  nl: {
    title: "E-mailinstellingen",
    intro: "Kies welke e-mails u van nisd2.eu ontvangt. Wijzigingen gaan meteen in.",
    allOnTitle: "Optionele e-mails ontvangen",
    allOnDescription:
      "Uitvinken betekent: alleen nog het noodzakelijke, dus aanmeldcodes, beveiligingsmeldingen en accountwijzigingen.",
    alwaysSent: "Wordt altijd verzonden",
    saved: "Opgeslagen",
    failed: "Opslaan mislukt. Probeer het opnieuw.",
    invalid: "Deze link is niet meer geldig",
    invalidHelp:
      "De link is waarschijnlijk afgekapt bij het kopiëren. Schrijf ons, dan stellen wij het in.",
  },
};
