import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.2",
  slug: "essential-vs-important",
  title: { en: "Who Is in Scope \u2014 Essential vs Important Entities", nl: "Wie valt in scope – essentiële versus belangrijke entiteiten", de: "Wer betroffen ist \u2014 wesentliche und wichtige Einrichtungen" },
  moduleId: "module-1",
  order: 1,
  contentFile: "1-2",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 3,
  nextLessonId: "1.3",
  prevLessonId: "1.1",
});

export default lesson;
