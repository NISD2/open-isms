import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.11",
  slug: "pre-audit-gap-scenario",
  title: { en: "Scenario - Pre-Audit Gap Discovery", nl: "Scenario – Pre-audit ontdekking van een lacune", de: "Szenario – Lücke vor der Prüfung entdeckt" },
  moduleId: "module-3",
  order: 10,
  contentFile: "3-11",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: "4.1",
  prevLessonId: "3.10",
});

export default lesson;
