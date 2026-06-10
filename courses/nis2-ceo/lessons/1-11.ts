import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.11",
  slug: "reporting-cascade",
  title: { en: "The Reporting Cascade and Significant Incidents", nl: "De meldingscascade en significante incidenten", de: "Die Meldekaskade und erhebliche Sicherheitsvorfälle" },
  moduleId: "module-1",
  order: 10,
  contentFile: "1-11",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 3,
  nextLessonId: "1.12",
  prevLessonId: "1.10",
});

export default lesson;
