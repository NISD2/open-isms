import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.12",
  slug: "customer-notification",
  title: { en: "The Customer Notification Duty", nl: "De klantmeldingsplicht", de: "Die Unterrichtungspflicht gegenüber Kunden" },
  moduleId: "module-1",
  order: 11,
  contentFile: "1-12",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 3,
  nextLessonId: "2.1",
  prevLessonId: "1.11",
});

export default lesson;
