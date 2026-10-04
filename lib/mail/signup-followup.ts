import { getPathname } from "@/i18n/navigation";
import { bookingUrlFor } from "@/lib/booking";
import { baseUrl } from "@/lib/seo";
import type { EmailLocale } from "./locale";

/** So a call booked from this mail says where it came from (cal.com hidden questions). */
const FOLLOW_UP_TAGS = "?utm_source=signup&utm_medium=email&utm_campaign=follow-up";

type FollowUpLocale = "de" | "en";

interface FollowUpParts {
  readonly greeting: string;
  readonly booking: string;
  readonly approval: string;
}

const COPY: Record<
  FollowUpLocale,
  {
    readonly subject: string;
    readonly body: (p: FollowUpParts) => string;
    readonly hello: string;
  }
> = {
  de: {
    subject: "Ihre Anmeldung bei nisd2.eu",
    hello: "Guten Tag",
    body: ({ greeting, booking, approval }) =>
      [
        `${greeting},`,
        "",
        "danke für Ihre Anmeldung bei nisd2.eu. Ich bin einer der beiden Gründer und schreibe Ihnen persönlich.",
        "",
        "Eine kurze Frage vorweg: Sollen Sie NIS2 in Ihrem Betrieb umsetzen, oder schauen Sie sich das Thema erst einmal an?",
        "",
        "Wenn Sie es umsetzen sollen: Der NIS 2 Durchgang führt Sie Schritt für Schritt durch NIS2. Sie füllen aus, wir erklären jeden Punkt in einfachen Worten, und am Ende gibt Ihre Geschäftsführung die Dokumente in der App frei. 4.800 € netto im Jahr, auf Rechnung, 30 Tage Geld zurück.",
        "",
        "Lieber erst sehen? Dann zeige ich Ihnen den Durchgang in einem kurzen Gespräch, zu einem Termin Ihrer Wahl:",
        booking,
        "",
        "Entscheidet jemand anderes? Hier ist eine Seite für Ihre Geschäftsführung:",
        approval,
        "",
        "Passt es gerade nicht, ignorieren Sie diese Mail einfach.",
        "",
        "Viele Grüße",
        "",
      ].join("\n"),
  },
  en: {
    subject: "Your signup at nisd2.eu",
    hello: "Hello",
    body: ({ greeting, booking, approval }) =>
      [
        `${greeting},`,
        "",
        "thank you for signing up at nisd2.eu. I am one of the two founders and am writing to you personally.",
        "",
        "One quick question first: have you been asked to implement NIS2 at your company, or are you looking into the topic for now?",
        "",
        "If you have to implement it: the NIS 2 walkthrough takes you through NIS2 step by step. You fill it in, we explain every point in plain words, and at the end your management approves the documents in the app. EUR 4,800 net per year, on invoice, 30 days money back.",
        "",
        "Rather see it first? Then I will show you the walkthrough in a short call, at a time that suits you:",
        booking,
        "",
        "Does someone else decide? Here is a page for your management:",
        approval,
        "",
        "If now is not a good time, just ignore this email.",
        "",
        "Best regards",
        "",
      ].join("\n"),
  },
};

/**
 * The personal follow-up an operator sends a new signup from the signup notice: one question,
 * the offer and its price, the call, and the page for whoever signs. German for German signups,
 * English for everyone else (the walk itself is German and English). A name that is really an
 * email address (Google can hand one over as the name) is left out of the greeting.
 */
export function signupFollowUp(opts: {
  readonly name: string | null;
  readonly locale: EmailLocale;
}): { readonly locale: FollowUpLocale; readonly subject: string; readonly body: string } {
  const locale: FollowUpLocale = opts.locale === "de" ? "de" : "en";
  const copy = COPY[locale];
  const name = opts.name?.trim() ?? "";
  const greeting = name && !name.includes("@") ? `${copy.hello} ${name}` : copy.hello;
  const approval = `${baseUrl}${getPathname({ href: "/pricing/approval", locale })}`;
  return {
    locale,
    subject: copy.subject,
    body: copy.body({ greeting, booking: bookingUrlFor(FOLLOW_UP_TAGS), approval }),
  };
}
