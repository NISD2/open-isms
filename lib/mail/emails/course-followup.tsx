import { Link } from "@react-email/components";
import { EmailFrame } from "../components/frame";
import { MutedLink, Para, SmallPrint } from "../components/parts";
import { BRAND } from "../layout";
import type { WorkflowMailLocale } from "../locale";

export interface CourseFollowupProps {
  readonly locale: WorkflowMailLocale;
  readonly greeting: string;
  readonly courses: readonly { readonly title: string; readonly resumeUrl: string }[];
  readonly unsubscribeUrl: string;
}

export const COURSE_FOLLOWUP_COPY: Record<
  WorkflowMailLocale,
  {
    readonly greeting: (firstName: string | undefined) => string;
    readonly subject: (single: boolean, firstTitle: string) => string;
    readonly intro: (single: boolean) => string;
    readonly question: (single: boolean) => string;
    readonly resume: (single: boolean) => string;
    readonly thanks: string;
    readonly unsubscribe: string;
  }
> = {
  en: {
    greeting: (firstName) => (firstName ? `Hi ${firstName}` : "Hi"),
    subject: (single, firstTitle) =>
      single
        ? `Following up on the ${firstTitle} course`
        : "Following up on your NISD2 courses",
    intro: (single) =>
      `Simon here, from NISD2. I noticed you started ${single ? "a course with us" : "some courses with us"} and haven't been back in a while:`,
    // About their last time with the course, not their opinion of it: what happened is what a
    // reply can tell us.
    question: (single) =>
      `Quick question: the last time you had ${single ? "the course" : "one of the courses"} open, what made you stop? Even a one-line reply helps me make the next version better.`,
    resume: (single) =>
      `If you want to pick up where you left off, the link${single ? "" : "s"} above ${single ? "takes" : "take"} you straight back.`,
    thanks: "Thanks,",
    unsubscribe: "Unsubscribe from follow-up emails",
  },
  // A Czech greeting needs the vocative, which a stored name does not give us, so it stays bare.
  cs: {
    greeting: () => "Dobrý den",
    subject: (single, firstTitle) =>
      single
        ? `Jak to jde s kurzem ${firstTitle}?`
        : "Jak to jde s vašimi kurzy na NISD2?",
    intro: (single) =>
      single
        ? "tady Simon z NISD2. Všiml jsem si, že jste u nás začali kurz a delší dobu jste se k němu nevrátili:"
        : "tady Simon z NISD2. Všiml jsem si, že jste u nás začali několik kurzů a delší dobu jste se k nim nevrátili:",
    question: (single) =>
      `Krátká otázka: když jste měli ${single ? "kurz" : "některý z kurzů"} naposledy otevřený, co vás přimělo přestat? I odpověď na jeden řádek mi pomůže udělat příští verzi lepší.`,
    resume: (single) =>
      single
        ? "Pokud chcete pokračovat tam, kde jste skončili, odkaz výše vás vrátí přímo zpět."
        : "Pokud chcete pokračovat tam, kde jste skončili, odkazy výše vás vrátí přímo zpět.",
    thanks: "Díky,",
    unsubscribe: "Odhlásit navazující e-maily ke kurzům",
  },
};

/**
 * Sent by the daily course-reminder cron to people who started a course and have not been back in
 * seven days: every stalled course in one email, and one question about the last time they had it
 * open.
 */
export default function CourseFollowupEmail({
  locale,
  greeting,
  courses,
  unsubscribeUrl,
}: CourseFollowupProps) {
  const copy = COURSE_FOLLOWUP_COPY[locale];
  const single = courses.length === 1;
  const spaced = { margin: "0 0 16px" } as const;
  return (
    <EmailFrame chrome={{ locale }}>
      <Para style={spaced}>{greeting},</Para>
      <Para style={spaced}>{copy.intro(single)}</Para>
      <ul
        style={{
          color: BRAND.foreground,
          lineHeight: 1.6,
          margin: "0 0 20px",
          paddingLeft: "20px",
        }}
      >
        {courses.map((c) => (
          <li key={c.resumeUrl} style={{ margin: "0 0 6px" }}>
            <Link
              href={c.resumeUrl}
              style={{ color: BRAND.primary, textDecoration: "none", fontWeight: 500 }}
            >
              {c.title}
            </Link>
          </li>
        ))}
      </ul>
      <Para style={spaced}>{copy.question(single)}</Para>
      <Para>{copy.resume(single)}</Para>
      <Para style={{ margin: "24px 0 0" }}>
        {copy.thanks}
        <br />
        Simon
      </Para>
      <SmallPrint>
        <MutedLink href={unsubscribeUrl}>{copy.unsubscribe}</MutedLink>
      </SmallPrint>
    </EmailFrame>
  );
}

CourseFollowupEmail.PreviewProps = {
  locale: "en",
  greeting: "Hi Jan",
  courses: [
    { title: "NIS 2 for CEOs", resumeUrl: "https://nisd2.eu/training/courses/nis2-ceo" },
  ],
  unsubscribeUrl: "https://nisd2.eu/u",
} satisfies CourseFollowupProps;
