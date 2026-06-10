import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.10",
  slug: "all-hazards-state-of-art",
  title: { en: "All-Hazards Approach and State of the Art", nl: "All-hazards benadering en stand van de techniek", de: "Gefahrenübergreifender Ansatz und Stand der Technik" },
  moduleId: "module-1",
  order: 9,
  contentFile: "1-10",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 3,
  nextLessonId: "1.11",
  prevLessonId: "1.9",
});

export default lesson;
