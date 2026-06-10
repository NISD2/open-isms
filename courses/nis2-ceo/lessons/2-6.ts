import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.6",
  slug: "measure-1-risk-policies",
  title: { en: "Measure 1 - Risk Analysis and Information Security Policies", nl: "Maatregel 1 – Risicoanalyse en informatiebeveiligingsbeleid", de: "Maßnahme 1 – Risikoanalyse und Informationssicherheitsleitlinien" },
  moduleId: "module-2",
  order: 5,
  contentFile: "2-6",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.7",
  prevLessonId: "2.5",
});

export default lesson;
