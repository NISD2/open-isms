import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "4.5",
  slug: "crisis-communication",
  title: { en: "First 48 Hours of Crisis Communication", nl: "Eerste 48 uur van crisiscommunicatie", de: "Die ersten 48 Stunden der Krisenkommunikation" },
  moduleId: "module-4",
  order: 4,
  contentFile: "4-5",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "4.6",
  prevLessonId: "4.4",
});

export default lesson;
