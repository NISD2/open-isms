import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "0.1",
  slug: "about-the-course",
  title: { en: "About This Course", nl: "Over deze cursus", de: "Über diesen Kurs", fr: "À propos de ce cours", it: "Informazioni su questo corso", es: "Acerca de este curso", pl: "O tym kursie" },
  moduleId: "foundation",
  order: 0,
  contentFile: "0-1",
  videoUrl: undefined,
  hasQuiz: false,
  estimatedMinutes: 4,
  nextLessonId: "1.1",
  prevLessonId: null,
});

export default lesson;
