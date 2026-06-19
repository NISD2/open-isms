import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.3",
  slug: "retention-and-access",
  title: { en: "The 10-Year Retention Rule and Who Gets Access", de: "Die 10-Jahres-Aufbewahrungspflicht und wer Zugang erhält", fr: "La règle de conservation de 10 ans et qui obtient l'accès", it: "La regola di conservazione di 10 anni e chi ottiene l'accesso", es: "La regla de conservación de 10 años y quién obtiene acceso", pl: "Zasada przechowywania przez 10 lat i kto uzyskuje dostęp" },
  moduleId: "module-1",
  order: 2,
  contentFile: "1-3",
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "2.1",
  prevLessonId: "1.2",
});

export default lesson;
