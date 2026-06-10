import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.4",
  slug: "red-flags",
  title: { en: "Red Flags in Your Team's Sign-Off Process", nl: "Rode vlaggen in uw goedkeuringsproces", de: "Warnsignale im Freigabeprozess Ihres Teams" },
  moduleId: "module-3",
  order: 3,
  contentFile: "3-4",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "3.5",
  prevLessonId: "3.3",
});

export default lesson;
