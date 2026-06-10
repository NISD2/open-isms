import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.8",
  slug: "ransomware-scenario",
  title: { en: "Scenario - Ransomware Hits Friday Afternoon", nl: "Scenario – Ransomware op vrijdagmiddag", de: "Szenario – Ransomware-Angriff am Freitagnachmittag" },
  moduleId: "module-3",
  order: 7,
  contentFile: "3-8",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 8,
  nextLessonId: "3.9",
  prevLessonId: "3.7",
});

export default lesson;
