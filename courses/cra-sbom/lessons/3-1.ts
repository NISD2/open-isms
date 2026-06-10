import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.1",
  slug: "building-your-sbom",
  title: { en: "Building Your SBOM: Tools and Pipeline Integration", de: "SBOM erstellen: Werkzeuge und Pipeline-Integration" },
  moduleId: "module-3",
  order: 0,
  contentFile: "3-1",
  hasQuiz: true,
  estimatedMinutes: 8,
  nextLessonId: "3.2",
  prevLessonId: "2.2",
});

export default lesson;
