import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.2",
  slug: "essential-vs-important",
  title: { en: "Who Is in Scope — Essential vs Important Entities", nl: "Wie valt in scope – essentiële versus belangrijke entiteiten", de: "Wer betroffen ist — wesentliche und wichtige Einrichtungen", fr: "Qui est concerné : entités essentielles et importantes", it: "Chi rientra nell'ambito: entità essenziali e importanti", es: "Quién está dentro del ámbito: entidades esenciales e importantes", pl: "Kogo to dotyczy: podmioty kluczowe i ważne", cs: "Na koho se vztahuje: subjekty zásadní a důležité", pt: "Quem está abrangido: entidades essenciais e importantes", ro: "Cine intră în domeniul de aplicare: entități esențiale și importante" },
  moduleId: "module-1",
  order: 1,
  contentFile: "1-2",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 3,
  nextLessonId: "1.3",
  prevLessonId: "1.1",
});

export default lesson;
