import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "0.1",
  slug: "what-is-a-tabletop",
  title: { en: "What a Tabletop Is and Why NIS 2 Demands One", de: "Was eine Tabletop-Übung ist und warum NIS 2 sie verlangt" },
  moduleId: "foundation",
  order: 0,
  contentFile: "0-1",
  hasQuiz: false,
  estimatedMinutes: 5,
  nextLessonId: "1.1",
  prevLessonId: null,
});

export default lesson;
