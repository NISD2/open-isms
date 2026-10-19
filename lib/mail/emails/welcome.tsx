import { Link } from "@react-email/components";
import { EmailFrame } from "../components/frame";
import { InlineLink, Para } from "../components/parts";
import { displayableFirstName } from "../first-name";
import { BRAND } from "../layout";
import type { WorkflowMailLocale } from "../locale";

export interface WelcomeProps {
  readonly locale: WorkflowMailLocale;
  readonly name: string;
  /** Where questions reach a person: the published contact address on nisd2.eu. */
  readonly contact: string;
  /** The page that books a call; null where the instance has no calendar (a self-hosted one). */
  readonly bookingUrl: string | null;
}

/** A sentence with one link in it: the text before the link, the link, the text after. */
interface Linked {
  readonly before: string;
  readonly link: string;
  readonly href: string;
  readonly after: string;
}

/** The plain-text twin of a linked sentence, the address spelled out after the link. */
const linkedText = ({ before, link, href, after }: Linked): string =>
  `${before}${link} (${href})${after}`;

export const WELCOME_COPY: Record<
  WorkflowMailLocale,
  {
    readonly subject: string;
    readonly preview: string;
    /** `firstName` is null when the stored name does not read as one (`displayableFirstName`). */
    readonly hello: (firstName: string | null) => string;
    readonly thanks: string;
    readonly course: Linked;
    /** Where a calendar exists: a link to book a call, then the address to write to. */
    readonly questionsWithCall: Pick<Linked, "before" | "link" | "after">;
    readonly questions: string;
    readonly reason: string;
  }
> = {
  en: {
    subject: "Welcome to NISD2",
    preview:
      "Thanks for signing up. A good first step is the free CEO and management course.",
    hello: (firstName) => (firstName ? `Hey ${firstName},` : "Hey,"),
    thanks: "welcome to NISD2. Thanks for signing up.",
    course: {
      before: "A good first step is the free ",
      link: "CEO and management course",
      href: "https://nisd2.eu/training/courses/nis2-ceo",
      after: ".",
    },
    questionsWithCall: {
      before: "If you have any questions, you can ",
      link: "book a call",
      after: " or contact us directly at ",
    },
    questions: "If you have any questions, contact us directly at ",
    reason: "You're receiving this because you created an account at nisd2.eu.",
  },
  // The Czech duty to train management is in the decrees, and NÚKIB names the proof it accepts:
  // the certificate of its own course. Our course is the first step, never the proof.
  cs: {
    subject: "Vítejte v NISD2",
    preview:
      "Děkujeme za registraci. Dobrým prvním krokem je bezplatné školení pro vedení společnosti.",
    hello: () => "Dobrý den,",
    thanks: "vítejte v NISD2. Děkujeme za registraci.",
    course: {
      before: "Dobrým prvním krokem je bezplatné ",
      link: "Školení NIS2 pro vedení společnosti",
      href: "https://nisd2.eu/cs/training/courses/nis2-ceo",
      after:
        ". Vysvětluje, co NIS 2 skutečně požaduje od vedení, a zabere asi 4 hodiny. Jako doklad o povinném školení vrcholného vedení (vyhláška č. 410/2025 Sb., § 4 písm. b); vyhláška č. 409/2025 Sb., § 4 odst. 1 písm. a)) uznává NÚKIB certifikát svého kurzu pro vrcholné vedení na osveta.nukib.gov.cz.",
    },
    questionsWithCall: {
      before: "Pokud máte jakékoli otázky, můžete si ",
      link: "domluvit hovor",
      after: " nebo nám napsat na ",
    },
    questions: "Pokud máte jakékoli otázky, napište nám na ",
    reason: "Tento e-mail dostáváte, protože jste si založili účet na nisd2.eu.",
  },
};

/** The plain-text twin of the welcome, line for line. */
export function welcomeText({ locale, name, contact, bookingUrl }: WelcomeProps): string {
  const copy = WELCOME_COPY[locale];
  const questions = bookingUrl
    ? linkedText({ ...copy.questionsWithCall, href: bookingUrl })
    : copy.questions;
  return [
    copy.hello(displayableFirstName(name)),
    copy.thanks,
    linkedText(copy.course),
    `${questions}${contact}.`,
    "Cory Hisey\nnisd2.eu",
    copy.reason,
  ].join("\n\n");
}

const paragraph = { fontSize: "15px", lineHeight: 1.65, margin: "0 0 16px" } as const;

function LinkedPara({ text }: { readonly text: Linked }) {
  return (
    <Para style={paragraph}>
      {text.before}
      <InlineLink href={text.href}>{text.link}</InlineLink>
      {text.after}
    </Para>
  );
}

/** After the first sign-in: a short note from the team and one place to start. */
export default function WelcomeEmail({
  locale,
  name,
  contact,
  bookingUrl,
}: WelcomeProps) {
  const copy = WELCOME_COPY[locale];
  return (
    <EmailFrame chrome={{ locale }} preview={copy.preview}>
      <p
        style={{
          color: BRAND.foreground,
          fontSize: "18px",
          fontWeight: 600,
          margin: "0 0 16px",
        }}
      >
        {copy.hello(displayableFirstName(name))}
      </p>
      <Para style={paragraph}>{copy.thanks}</Para>
      <LinkedPara text={copy.course} />
      <Para style={paragraph}>
        {bookingUrl ? (
          <>
            {copy.questionsWithCall.before}
            <InlineLink href={bookingUrl}>{copy.questionsWithCall.link}</InlineLink>
            {copy.questionsWithCall.after}
          </>
        ) : (
          copy.questions
        )}
        <InlineLink href={`mailto:${contact}`}>{contact}</InlineLink>.
      </Para>
      <p
        style={{
          color: BRAND.foreground,
          fontSize: "15px",
          lineHeight: 1.65,
          margin: "24px 0 0",
        }}
      >
        Cory Hisey
        <br />
        <Link
          href="https://nisd2.eu"
          style={{ color: BRAND.mutedForeground, textDecoration: "none" }}
        >
          nisd2.eu
        </Link>
      </p>
      <p style={{ color: BRAND.mutedForeground, fontSize: "12px", margin: "24px 0 0" }}>
        {copy.reason}
      </p>
    </EmailFrame>
  );
}

WelcomeEmail.PreviewProps = {
  locale: "en",
  name: "Anna",
  contact: "contact@nisd2.eu",
  bookingUrl: "https://cal.com/nisd2",
} satisfies WelcomeProps;
