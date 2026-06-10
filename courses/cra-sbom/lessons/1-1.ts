import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.1",
  slug: "what-goes-into-an-sbom",
  title: { en: "What Goes Into an SBOM: Components, Versions, and Identifiers", de: "Was in eine SBOM gehört: Komponenten, Versionen und Bezeichner" },
  moduleId: "module-1",
  order: 0,
  contentFile: "1-1",
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: "1.2",
  prevLessonId: "0.1",
});

export default lesson;
