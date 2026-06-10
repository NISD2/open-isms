import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.2",
  slug: "role-assignments",
  title: { en: "Role Assignments: Who Must Be in the Room", de: "Rollen: Wer bei der Übung anwesend sein muss" },
  moduleId: "module-1",
  order: 1,
  contentFile: "1-2",
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "1.3",
  prevLessonId: "1.1",
});

export default lesson;
