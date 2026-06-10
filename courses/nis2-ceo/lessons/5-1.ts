import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "5.1",
  slug: "implementation-roadmap",
  title: { en: "Your First 90 Days After This Course", nl: "Uw eerste 90 dagen na deze cursus", de: "Ihre ersten 90 Tage nach diesem Kurs" },
  moduleId: "final",
  order: 0,
  contentFile: "5-1",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "5.2",
  prevLessonId: "4.6",
});

export default lesson;
