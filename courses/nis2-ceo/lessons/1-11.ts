import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.11",
  slug: "reporting-cascade",
  title: { en: "The Reporting Cascade and Significant Incidents", nl: "De meldingscascade en significante incidenten", de: "Die Meldekaskade und erhebliche Sicherheitsvorfälle", fr: "La cascade de notification et les incidents importants", it: "La cascata di notifica e gli incidenti significativi", es: "La cascada de notificación y los incidentes significativos", pl: "Kaskada zgłaszania i poważne incydenty", cs: "Kaskáda hlášení a významné incidenty", pt: "A cascata de notificação e os incidentes significativos", ro: "Cascada de raportare și incidentele semnificative" },
  moduleId: "module-1",
  order: 10,
  contentFile: "1-11",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 3,
  nextLessonId: "1.12",
  prevLessonId: "1.10",
});

export default lesson;
