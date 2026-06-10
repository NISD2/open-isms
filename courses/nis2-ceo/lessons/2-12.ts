import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.12",
  slug: "measure-7-hygiene-training",
  title: { en: "Measure 7 - Cyber Hygiene and Training", nl: "Maatregel 7 – Cyberhygiëne en training", de: "Maßnahme 7 – Cyberhygiene und Schulungen" },
  moduleId: "module-2",
  order: 11,
  contentFile: "2-12",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.13",
  prevLessonId: "2.11",
});

export default lesson;
