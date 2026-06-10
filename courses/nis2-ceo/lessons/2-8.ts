import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.8",
  slug: "measure-3-bcm",
  title: { en: "Measure 3 - Business Continuity", nl: "Maatregel 3 – Bedrijfscontinuïteit", de: "Maßnahme 3 – Aufrechterhaltung des Betriebs" },
  moduleId: "module-2",
  order: 7,
  contentFile: "2-8",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.9",
  prevLessonId: "2.7",
});

export default lesson;
