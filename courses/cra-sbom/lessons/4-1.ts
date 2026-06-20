import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "4.1",
  slug: "final-assessment",
  title: { en: "Final Assessment", de: "Abschlussprüfung", fr: "Évaluation finale", it: "Valutazione finale", es: "Evaluación final", pl: "Ocena końcowa", cs: "Závěrečné hodnocení", pt: "Avaliação final", ro: "Evaluare finală" },
  moduleId: "final",
  order: 0,
  contentFile: "4-1",
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: null,
  prevLessonId: "3.2",
});

export default lesson;
