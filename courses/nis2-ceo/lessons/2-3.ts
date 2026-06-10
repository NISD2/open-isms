import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.3",
  slug: "risk-treatment",
  title: { en: "Risk Treatment Options and Risk Appetite", nl: "Risicobehandeling en risicobereidheid", de: "Risikobehandlung und Risikoappetit" },
  moduleId: "module-2",
  order: 2,
  contentFile: "2-3",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.4",
  prevLessonId: "2.2",
});

export default lesson;
