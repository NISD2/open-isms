import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.1",
  slug: "article-23-cascade",
  title: { en: "The Article 23 Cascade Your Exercise Must Rehearse", de: "Die Meldekaskade nach Artikel 23, die Ihre Übung durchspielen muss" },
  moduleId: "module-1",
  order: 0,
  contentFile: "1-1",
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "1.2",
  prevLessonId: "0.1",
});

export default lesson;
