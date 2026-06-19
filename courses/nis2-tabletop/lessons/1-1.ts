import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.1",
  slug: "article-23-cascade",
  title: { en: "The Article 23 Cascade Your Exercise Must Rehearse", de: "Die Meldekaskade nach Artikel 23, die Ihre Übung durchspielen muss", fr: "La cascade de notification de l'article 23 que votre exercice doit répéter", it: "La cascata di notifica dell'articolo 23 che la vostra esercitazione deve provare", es: "La cascada de notificación del artículo 23 que su ejercicio debe ensayar", pl: "Kaskada zgłoszeń z artykułu 23, którą Twoje ćwiczenie musi przećwiczyć" },
  moduleId: "module-1",
  order: 0,
  contentFile: "1-1",
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "1.2",
  prevLessonId: "0.1",
});

export default lesson;
