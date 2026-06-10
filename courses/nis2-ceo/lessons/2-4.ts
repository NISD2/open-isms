import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.4",
  slug: "continuous-risk",
  title: { en: "Why Risk Management Is Continuous", nl: "Waarom risicobeheer continu is", de: "Warum Risikomanagement ein fortlaufender Prozess ist" },
  moduleId: "module-2",
  order: 3,
  contentFile: "2-4",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.5",
  prevLessonId: "2.3",
});

export default lesson;
