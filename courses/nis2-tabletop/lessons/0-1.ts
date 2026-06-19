import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "0.1",
  slug: "what-is-a-tabletop",
  title: { en: "What a Tabletop Is and Why NIS 2 Demands One", de: "Was eine Tabletop-Übung ist und warum NIS 2 sie verlangt", fr: "Ce qu'est un exercice sur table et pourquoi NIS 2 en exige un", it: "Cos'è un'esercitazione a tavolino e perché NIS 2 ne richiede una", es: "Qué es un ejercicio de simulación y por qué NIS 2 lo exige", pl: "Czym jest ćwiczenie sztabowe i dlaczego NIS 2 go wymaga" },
  moduleId: "foundation",
  order: 0,
  contentFile: "0-1",
  hasQuiz: false,
  estimatedMinutes: 5,
  nextLessonId: "1.1",
  prevLessonId: null,
});

export default lesson;
