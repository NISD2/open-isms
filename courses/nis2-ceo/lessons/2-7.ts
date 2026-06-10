import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.7",
  slug: "measure-2-incident-handling",
  title: { en: "Measure 2 - Incident Handling", nl: "Maatregel 2 – Incidentbeheer", de: "Maßnahme 2 – Bewältigung von Sicherheitsvorfällen" },
  moduleId: "module-2",
  order: 6,
  contentFile: "2-7",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.8",
  prevLessonId: "2.6",
});

export default lesson;
