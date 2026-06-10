import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.7",
  slug: "bsi-audit-walkthrough",
  title: { en: "What Happens During a Regulator Audit", nl: "Wat er gebeurt tijdens een toezichtaudit", de: "Was bei einer behördlichen Prüfung passiert" },
  moduleId: "module-3",
  order: 6,
  contentFile: "3-7",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: "3.8",
  prevLessonId: "3.6",
});

export default lesson;
