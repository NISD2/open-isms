/**
 * The activation nudge's words (activation-nudge.ts decides who gets which version). The
 * walkthrough is written in German, English and Czech, and the email follows the language the
 * reader lands in (`walkLocaleOf`): a Dutch reader gets the English walkthrough, so the English
 * email.
 */
import { DURCHGANG_MESSAGES } from "@/i18n/durchgang";
import type { WalkLocale } from "@/lib/durchgang";

/** The walkthrough's own words, as its pages read them: step headlines and button labels. */
export const WALK_COPY = {
  de: DURCHGANG_MESSAGES.de.durchgang,
  en: DURCHGANG_MESSAGES.en.durchgang,
  cs: DURCHGANG_MESSAGES.cs.durchgang,
} as const satisfies Record<WalkLocale, unknown>;

interface NudgeCopy {
  /** Salutation line including the trailing comma. */
  greeting: (firstName: string | null) => string;
  subjectNext: string;
  subjectFirst: string;
  /** Open walkthrough with steps finished. */
  progress: (done: number, total: number) => string;
  /** Open walkthrough, nothing finished yet. */
  fresh: (total: number) => string;
  /** Locked walkthrough. */
  locked: (total: number) => string;
  /** How the walkthrough works, in the words of its home's promise cards. */
  promise: string;
  /** Locked only: what the page the link opens shows. */
  unlock: string;
  /** Locked only; the open version takes its home's own button labels. */
  see: string;
  /**
   * One question about the reader's own last time, so a reply tells us what happened rather than
   * what they think of us. Replies reach a person (the dispatcher sets the reply address).
   */
  askStarted: string;
  /** The same for someone who has not begun the walkthrough: what brought them here. */
  askNew: string;
  /** The From line names Simon, so the letter ends with his name. */
  signOff: string;
  /**
   * The link flips user.emailFollowupsDisabled, which stops ALL soft-touch
   * follow-up email (digests, course follow-ups, lifecycle nudges) — so the
   * label stays category-wide, never "these" emails only.
   */
  unsubscribe: string;
}

export const NUDGE_COPY: Record<WalkLocale, NudgeCopy> = {
  de: {
    greeting: (firstName) => (firstName ? `Guten Tag, ${firstName},` : "Guten Tag,"),
    subjectNext: "Ihr nächster Schritt",
    subjectFirst: "Ihr erster Schritt",
    progress: (done, total) =>
      `Im NIS 2 Durchgang sind ${done} von ${total} Punkten bearbeitet. Als Nächstes steht an:`,
    fresh: (total) =>
      `Ihr NIS 2 Durchgang ist freigeschaltet: ${total} Punkte, von der Registrierung beim BSI bis zur Unterschrift der Geschäftsführung. Der erste Punkt:`,
    locked: (total) =>
      `Im NIS 2 Durchgang gehen Sie die Pflichten aus NIS 2 Punkt für Punkt durch: ${total} Punkte, von der Registrierung beim BSI bis zur Unterschrift der Geschäftsführung. Der erste Punkt:`,
    promise:
      "Sie sehen immer nur einen Punkt, und was noch nicht geht, legen Sie zur Seite. Am Ende sieht die Geschäftsführung alles durch und unterschreibt.",
    unlock:
      "Unter dem Link sehen Sie jeden Punkt vorab und wie Sie den Durchgang freischalten.",
    see: "Durchgang ansehen",
    askStarted:
      "Eine Frage noch: Als Sie zuletzt im Durchgang waren, was hat Sie unterbrochen? Eine Zeile als Antwort reicht.",
    askNew:
      "Eine Frage noch: Was war der Anlass für Ihre Anmeldung bei nisd2.eu? Eine Zeile als Antwort reicht.",
    signOff: "Viele Grüße\nSimon",
    unsubscribe: "Erinnerungen per E-Mail abbestellen",
  },
  en: {
    greeting: (firstName) => (firstName ? `Hello ${firstName},` : "Hello,"),
    subjectNext: "Your next step",
    subjectFirst: "Your first step",
    progress: (done, total) =>
      `In your NIS 2 walkthrough, ${done} of ${total} items are dealt with. Next up:`,
    fresh: (total) =>
      `Your NIS 2 walkthrough is unlocked: ${total} items, from registering with your authority to management's signature. The first item:`,
    locked: (total) =>
      `The NIS 2 walkthrough takes you through the NIS 2 obligations item by item: ${total} items, from registering with your authority to management's signature. The first item:`,
    promise:
      "You only ever see one item, and what cannot be done yet you set aside. At the end, management reviews everything and signs.",
    unlock:
      "On the page you can see every item in advance and how to unlock the walkthrough.",
    see: "See the walkthrough",
    askStarted:
      "One question: the last time you were in the walkthrough, what interrupted you? A one-line reply is plenty.",
    askNew:
      "One question: what prompted you to sign up at nisd2.eu? A one-line reply is plenty.",
    signOff: "Best regards\nSimon",
    unsubscribe: "Unsubscribe from reminder emails",
  },
  // Bare greeting: Czech addresses a person in the vocative, which a stored name does not give us.
  // The sentence after it starts in lower case, as a Czech letter does after "Dobrý den,".
  cs: {
    greeting: () => "Dobrý den,",
    subjectNext: "Váš další krok",
    subjectFirst: "Váš první krok",
    progress: (done, total) =>
      `v průvodci NIS 2 je zpracováno ${done} z ${total} bodů. Na řadě je:`,
    fresh: (total) =>
      `váš průvodce NIS 2 je odemčený: ${total} bodů, od ohlášení služby NÚKIB až po podpis vedení. První bod:`,
    locked: (total) =>
      `průvodce NIS 2 vás provede povinnostmi z NIS 2 bod po bodu: ${total} bodů, od ohlášení služby NÚKIB až po podpis vedení. První bod:`,
    promise:
      "Vždy vidíte jen jeden bod, a co zatím nejde, odložíte. Na konci vedení vše projde a podepíše.",
    unlock: "Na stránce uvidíte každý bod předem a také to, jak průvodce odemknout.",
    see: "Zobrazit průvodce",
    askStarted:
      "Ještě jedna otázka: když jste byli v průvodci naposledy, co vás přerušilo? Stačí odpovědět jedním řádkem.",
    askNew:
      "Ještě jedna otázka: co vás přimělo zaregistrovat se na nisd2.eu? Stačí odpovědět jedním řádkem.",
    signOff: "S pozdravem\nSimon",
    unsubscribe: "Odhlásit připomínky e-mailem",
  },
};
