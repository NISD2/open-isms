import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.14",
  slug: "measure-9-hr-access-assets",
  title: { en: "Measure 9 - HR Security, Access Control, and Asset Management", nl: "Maatregel 9 – HR-beveiliging, toegangscontrole en middelenbeheer", de: "Maßnahme 9 – Personalsicherheit, Zugriffskontrolle und Asset-Management" },
  moduleId: "module-2",
  order: 13,
  contentFile: "2-14",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.15",
  prevLessonId: "2.13",
});

export default lesson;
