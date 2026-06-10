import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "4.1",
  slug: "final-assessment",
  title: { en: "Final Assessment", de: "Abschlussprüfung" },
  moduleId: "final",
  order: 0,
  contentFile: "4-1",
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: null,
  prevLessonId: "3.2",
});

export default lesson;
