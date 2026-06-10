import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.6",
  slug: "ciso-board-reporting",
  title: { en: "CISO and Supervisory Board Reporting Lines", nl: "CISO en rapportagelijnen van de raad van commissarissen", de: "CISO und Berichtslinien zum Aufsichtsrat" },
  moduleId: "module-3",
  order: 5,
  contentFile: "3-6",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "3.7",
  prevLessonId: "3.5",
});

export default lesson;
