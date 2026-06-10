import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "4.6",
  slug: "ransomware-payment",
  title: { en: "Ransomware Payment Decisions", nl: "Beslissingen over ransomwarebetaling", de: "Entscheidungen über Ransomware-Zahlungen" },
  moduleId: "module-4",
  order: 5,
  contentFile: "4-6",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "5.1",
  prevLessonId: "4.5",
});

export default lesson;
