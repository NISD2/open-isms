import { Link } from "@react-email/components";
import { EmailFrame } from "../components/frame";
import { MutedLink, Para, SmallPrint } from "../components/parts";
import { BRAND, ENGLISH_ONLY } from "../layout";

export interface CourseFollowupProps {
  readonly greeting: string;
  readonly courses: readonly { readonly title: string; readonly resumeUrl: string }[];
  readonly unsubscribeUrl: string;
}

/**
 * Sent by the daily course-reminder cron to people who started a course and have not been back in
 * seven days: every stalled course in one email, and one question about what got in the way.
 */
export default function CourseFollowupEmail({
  greeting,
  courses,
  unsubscribeUrl,
}: CourseFollowupProps) {
  const single = courses.length === 1;
  const spaced = { margin: "0 0 16px" } as const;
  return (
    <EmailFrame chrome={ENGLISH_ONLY}>
      <Para style={spaced}>{greeting},</Para>
      <Para style={spaced}>
        Simon here, from NISD2. I noticed you started{" "}
        {single ? "a course with us" : "some courses with us"} and haven't been back in a
        while:
      </Para>
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
      <Para style={spaced}>
        Quick question: what got in the way of finishing? Was something unclear, did the
        format not fit, or did NIS 2 turn out to be less relevant than you expected? Even
        a one-line reply helps me make the next version better.
      </Para>
      <Para>
        If you want to pick up where you left off, the link{single ? "" : "s"} above{" "}
        {single ? "takes" : "take"} you straight back.
      </Para>
      <Para style={{ margin: "24px 0 0" }}>
        Thanks,
        <br />
        Simon
      </Para>
      <SmallPrint>
        <MutedLink href={unsubscribeUrl}>Unsubscribe from follow-up emails</MutedLink>
      </SmallPrint>
    </EmailFrame>
  );
}

CourseFollowupEmail.PreviewProps = {
  greeting: "Hi Jan",
  courses: [
    { title: "NIS 2 for CEOs", resumeUrl: "https://nisd2.eu/training/courses/nis2-ceo" },
  ],
  unsubscribeUrl: "https://nisd2.eu/u",
} satisfies CourseFollowupProps;
