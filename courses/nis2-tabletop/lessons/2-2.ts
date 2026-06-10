import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.2",
  slug: "hot-wash-debrief",
  title: { en: "The Hot Wash Debrief", de: "Die Nachbesprechung (Hot Wash)" },
  moduleId: "module-2",
  order: 1,
  contentFile: "2-2",
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.3",
  prevLessonId: "2.1",
});

export default lesson;
