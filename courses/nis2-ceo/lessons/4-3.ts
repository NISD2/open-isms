import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "4.3",
  slug: "cyber-vs-do",
  title: { en: "Cyber Insurance vs D&O - Different Products, Different Coverage", nl: "Cyberverzekering versus D&O – Verschillende producten, verschillende dekking", de: "Cyberversicherung vs. D&O – unterschiedliche Produkte, unterschiedliche Deckung" },
  moduleId: "module-4",
  order: 2,
  contentFile: "4-3",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "4.4",
  prevLessonId: "4.2",
});

export default lesson;
