import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.8",
  slug: "business-judgment-rule",
  title: { en: "The Business Judgment Rule Does Not Protect You", nl: "De business judgment rule beschermt u niet", de: "Die Business Judgment Rule schützt Sie nicht", fr: "La business judgment rule ne vous protège pas", it: "La business judgment rule non vi protegge", es: "La business judgment rule no le protege", pl: "Business judgment rule cię nie chroni", cs: "Business judgment rule vás nechrání", pt: "A business judgment rule não o protege", ro: "Business judgment rule nu vă protejează" },
  moduleId: "module-1",
  order: 7,
  contentFile: "1-8",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 3,
  nextLessonId: "1.9",
  prevLessonId: "1.7",
});

export default lesson;
