import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "4.5",
  slug: "crisis-communication",
  title: { en: "First 48 Hours of Crisis Communication", nl: "Eerste 48 uur van crisiscommunicatie", de: "Die ersten 48 Stunden der Krisenkommunikation", fr: "Les 48 premières heures de communication de crise", it: "Le prime 48 ore di comunicazione di crisi", es: "Las primeras 48 horas de comunicación de crisis", pl: "Pierwsze 48 godzin komunikacji kryzysowej" },
  moduleId: "module-4",
  order: 4,
  contentFile: "4-5",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "4.6",
  prevLessonId: "4.4",
});

export default lesson;
