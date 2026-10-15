/**
 * The language of one reader's course follow-up (app/api/cron/course-reminders): the account's
 * language (user.locale, then the company's country, then German), the language the mail itself is
 * written in (English, Czech for a Czech reader), and where its course links point. A Czech reader
 * lands on the Czech course; everyone else keeps the unprefixed link the mail always had.
 */
import {
  type EmailLocale,
  resolveEmailLocale,
  type WorkflowMailLocale,
  workflowMailLocaleOf,
} from "@/lib/mail/locale";

const COURSE_PATH_PREFIX: Readonly<Record<WorkflowMailLocale, string>> = {
  en: "",
  cs: "/cs",
};

export interface FollowupLanguage {
  /** The reader's language, which the footer follows. */
  readonly locale: EmailLocale;
  /** The language of the mail's body and its course titles. */
  readonly mailLocale: WorkflowMailLocale;
}

export const followupLanguageOf = (
  userLocale: string | null,
  country: string | null,
): FollowupLanguage => {
  const locale = resolveEmailLocale(userLocale, country);
  return { locale, mailLocale: workflowMailLocaleOf(locale) };
};

/** A course's title in the mail's language, or English where the course has none in it. */
export const followupCourseTitle = (
  titles: Readonly<Record<string, string>>,
  mailLocale: WorkflowMailLocale,
): string | undefined => titles[mailLocale] ?? titles.en;

export const courseResumeUrl = (
  appUrl: string,
  courseId: string,
  mailLocale: WorkflowMailLocale,
): string =>
  `${appUrl}${COURSE_PATH_PREFIX[mailLocale]}/training/courses/${encodeURIComponent(courseId)}`;
