import { Link } from "@react-email/components";
import { EmailFrame } from "../components/frame";
import { InlineLink, Para } from "../components/parts";
import { BRAND } from "../layout";
import type { WorkflowMailLocale } from "../locale";

export interface WelcomeProps {
  readonly locale: WorkflowMailLocale;
  readonly name: string;
  /** Where questions reach a person: the published contact address on nisd2.eu. */
  readonly contact: string;
}

/** A sentence with one link in it: the text before the link, the link, the text after. */
interface Linked {
  readonly before: string;
  readonly link: string;
  readonly href: string;
  readonly after: string;
}

/** The plain-text twin of a linked sentence; `withHref` spells the address out after the link. */
export const linkedText = (
  { before, link, href, after }: Linked,
  withHref: boolean,
): string => `${before}${link}${withHref ? ` (${href})` : ""}${after}`;

export const WELCOME_COPY: Record<
  WorkflowMailLocale,
  {
    readonly subject: string;
    readonly preview: string;
    readonly hello: (name: string) => string;
    readonly thanks: string;
    readonly mission: Linked;
    readonly course: Linked;
    readonly questions: string;
    readonly reason: string;
  }
> = {
  en: {
    subject: "Your NISD2 account is ready",
    preview: "Welcome to NISD2: your NIS2 compliance platform",
    hello: (name) => `Hey ${name},`,
    thanks: "thanks for signing up.",
    mission: {
      before: "Our mission is straightforward: NIS2 compliance costs European companies ",
      link: "€31 billion every year",
      href: "https://nisd2.eu",
      after:
        ". We're cutting that in half by replacing expensive consultants with a platform that does the heavy lifting for you.",
    },
    course: {
      before: "A good first step is the ",
      link: "CEO & Management Training",
      href: "https://nisd2.eu/training/courses/nis2-ceo",
      after:
        ". It covers what NIS2 actually requires from leadership and satisfies the §38 BSIG training obligation, it takes about 4 hours.",
    },
    questions: "If you have any questions, write to me at ",
    reason: "You're receiving this because you created an account at nisd2.eu.",
  },
  // The Czech duty to train management is in the decrees, and NÚKIB names the proof it accepts:
  // the certificate of its own course. Our course is the first step, never the proof.
  cs: {
    subject: "Váš účet NISD2 je připravený",
    preview: "Vítejte v NISD2, platformě pro zavádění NIS 2",
    hello: () => "Dobrý den,",
    thanks: "děkujeme za registraci.",
    mission: {
      before: "Naše mise je jednoduchá: soulad s NIS 2 stojí evropské firmy ",
      link: "31 miliard eur ročně",
      href: "https://nisd2.eu/cs",
      after:
        ". Tyto náklady chceme snížit na polovinu tím, že drahé konzultanty nahradíme platformou, která za vás odvede většinu práce.",
    },
    course: {
      before: "Dobrým prvním krokem je ",
      link: "Školení NIS2 pro vedení společnosti",
      href: "https://nisd2.eu/cs/training/courses/nis2-ceo",
      after:
        ". Vysvětluje, co NIS 2 skutečně požaduje od vedení, a zabere asi 4 hodiny. Jako doklad o povinném školení vrcholného vedení (vyhláška č. 410/2025 Sb., § 4 písm. b); vyhláška č. 409/2025 Sb., § 4 odst. 1 písm. a)) uznává NÚKIB certifikát svého kurzu pro vrcholné vedení na osveta.nukib.gov.cz.",
    },
    questions: "Pokud máte jakékoli otázky, napište mi na ",
    reason: "Tento e-mail dostáváte, protože jste si založili účet na nisd2.eu.",
  },
};

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
export default function WelcomeEmail({ locale, name, contact }: WelcomeProps) {
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
        {copy.hello(name)}
      </p>
      <Para style={paragraph}>{copy.thanks}</Para>
      <LinkedPara text={copy.mission} />
      <LinkedPara text={copy.course} />
      <Para style={paragraph}>
        {copy.questions}
        <InlineLink href={`mailto:${contact}`}>{contact}</InlineLink>
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
          NISD2.eu
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
} satisfies WelcomeProps;
