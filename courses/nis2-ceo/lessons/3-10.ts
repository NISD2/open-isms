import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.10",
  slug: "phishing-scenario",
  title: { en: "Scenario - Phishing Success: Significant or Not?", nl: "Scenario – Phishing-succes: meldingsplichtig of niet?", de: "Szenario – Erfolgreicher Phishing-Angriff: meldepflichtig oder nicht?" },
  moduleId: "module-3",
  order: 9,
  contentFile: "3-10",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: "3.11",
  prevLessonId: "3.9",
});

export default lesson;
