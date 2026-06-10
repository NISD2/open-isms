import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.3",
  slug: "protocol-contents",
  title: { en: "The Protocol: What Audit-Grade Evidence Contains", de: "Das Übungsprotokoll: Was eine auditfeste Dokumentation enthält" },
  moduleId: "module-2",
  order: 2,
  contentFile: "2-3",
  hasQuiz: true,
  estimatedMinutes: 8,
  nextLessonId: "3.1",
  prevLessonId: "2.2",
});

export default lesson;
