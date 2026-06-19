import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.1",
  slug: "risk-equation",
  title: { en: "Risk = Likelihood x Impact", nl: "Risico = Kans × Impact", de: "Risiko = Eintrittswahrscheinlichkeit × Auswirkung", fr: "Risque = Probabilité x Impact", it: "Rischio = Probabilità x Impatto", es: "Riesgo = Probabilidad x Impacto", pl: "Ryzyko = Prawdopodobieństwo x Skutek" },
  moduleId: "module-2",
  order: 0,
  contentFile: "2-1",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.2",
  prevLessonId: "1.12",
});

export default lesson;
