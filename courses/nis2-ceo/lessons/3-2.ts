import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.2",
  slug: "sign-off-in-practice",
  title: { en: "Sign-Off in Practice", nl: "Goedkeuring in de praktijk", de: "Freigabe in der Praxis", fr: "La validation en pratique", it: "L'approvazione nella pratica", es: "La aprobación en la práctica", pl: "Zatwierdzanie w praktyce", cs: "Schvalování v praxi", pt: "A aprovação na prática", ro: "Aprobarea în practică" },
  moduleId: "module-3",
  order: 1,
  contentFile: "3-2",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "3.3",
  prevLessonId: "3.1",
});

export default lesson;
