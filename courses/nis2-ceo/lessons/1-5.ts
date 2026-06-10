import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.5",
  slug: "approve-oversee",
  title: { en: "Your Duty to Approve and Oversee", nl: "Uw plicht tot goedkeuring en toezicht", de: "Ihre Pflicht zur Billigung und Überwachung" },
  moduleId: "module-1",
  order: 4,
  contentFile: "1-5",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 3,
  nextLessonId: "1.6",
  prevLessonId: "1.4",
});

export default lesson;
