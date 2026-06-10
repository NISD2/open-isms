import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.8",
  slug: "business-judgment-rule",
  title: { en: "The Business Judgment Rule Does Not Protect You", nl: "De business judgment rule beschermt u niet", de: "Die Business Judgment Rule schützt Sie nicht" },
  moduleId: "module-1",
  order: 7,
  contentFile: "1-8",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 3,
  nextLessonId: "1.9",
  prevLessonId: "1.7",
});

export default lesson;
