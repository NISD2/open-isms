import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "4.4",
  slug: "policy-exclusions",
  title: { en: "Common Policy Exclusions to Read For", nl: "Veelvoorkomende polisuitsluitingen om op te letten", de: "Häufige Ausschlussklauseln, auf die Sie achten sollten" },
  moduleId: "module-4",
  order: 3,
  contentFile: "4-4",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "4.5",
  prevLessonId: "4.3",
});

export default lesson;
