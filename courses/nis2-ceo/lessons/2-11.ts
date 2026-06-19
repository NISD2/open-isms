import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.11",
  slug: "measure-6-effectiveness",
  title: { en: "Measure 6 - Effectiveness Assessment", nl: "Maatregel 6 – Effectiviteitsbeoordeling", de: "Maßnahme 6 – Bewertung der Wirksamkeit", fr: "Mesure 6 - Évaluation de l'efficacité", it: "Misura 6 - Valutazione dell'efficacia", es: "Medida 6 - Evaluación de la eficacia", pl: "Środek 6 - Ocena skuteczności" },
  moduleId: "module-2",
  order: 10,
  contentFile: "2-11",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.12",
  prevLessonId: "2.10",
});

export default lesson;
