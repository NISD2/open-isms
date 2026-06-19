import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.3",
  slug: "risk-treatment",
  title: { en: "Risk Treatment Options and Risk Appetite", nl: "Risicobehandeling en risicobereidheid", de: "Risikobehandlung und Risikoappetit", fr: "Options de traitement du risque et appétence au risque", it: "Opzioni di trattamento del rischio e propensione al rischio", es: "Opciones de tratamiento del riesgo y apetito de riesgo", pl: "Opcje postępowania z ryzykiem i apetyt na ryzyko" },
  moduleId: "module-2",
  order: 2,
  contentFile: "2-3",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.4",
  prevLessonId: "2.2",
});

export default lesson;
