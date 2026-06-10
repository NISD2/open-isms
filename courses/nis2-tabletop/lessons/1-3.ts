import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.3",
  slug: "facilitator-separation",
  title: { en: "The Facilitator-vs-Participant Separation", de: "Wer moderiert, spielt nicht mit" },
  moduleId: "module-1",
  order: 2,
  contentFile: "1-3",
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.1",
  prevLessonId: "1.2",
});

export default lesson;
