import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.1",
  slug: "what-is-nis2",
  title: { en: "What NIS2 Is and Why It Exists", nl: "Wat NIS2 is en waarom het bestaat", de: "Was NIS2 ist und warum es existiert", fr: "Ce qu'est NIS2 et pourquoi il existe", it: "Cos'è NIS2 e perché esiste", es: "Qué es NIS2 y por qué existe", pl: "Czym jest NIS2 i dlaczego istnieje" },
  moduleId: "module-1",
  order: 0,
  contentFile: "1-1",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 4,
  nextLessonId: "1.2",
  prevLessonId: "0.1",
});

export default lesson;
