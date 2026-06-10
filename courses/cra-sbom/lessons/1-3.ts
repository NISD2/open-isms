import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.3",
  slug: "retention-and-access",
  title: { en: "The 10-Year Retention Rule and Who Gets Access", de: "Die 10-Jahres-Aufbewahrungspflicht und wer Zugang erhält" },
  moduleId: "module-1",
  order: 2,
  contentFile: "1-3",
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "2.1",
  prevLessonId: "1.2",
});

export default lesson;
