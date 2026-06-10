import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.2",
  slug: "assets",
  title: { en: "What Is an Asset?", nl: "Wat is een bedrijfsmiddel?", de: "Was ist ein Asset?" },
  moduleId: "module-2",
  order: 1,
  contentFile: "2-2",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.3",
  prevLessonId: "2.1",
});

export default lesson;
