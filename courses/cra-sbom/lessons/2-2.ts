import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.2",
  slug: "spdx-and-choosing-your-format",
  title: { en: "SPDX and Choosing Your Format", de: "SPDX und die Wahl Ihres Formats", fr: "SPDX et le choix de votre format", it: "SPDX e la scelta del formato", es: "SPDX y la elección de su formato", pl: "SPDX i wybór formatu" },
  moduleId: "module-2",
  order: 1,
  contentFile: "2-2",
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: "3.1",
  prevLessonId: "2.1",
});

export default lesson;
