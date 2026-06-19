import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.6",
  slug: "training-duty",
  title: { en: "Your Training Duty", nl: "Uw trainingsplicht", de: "Ihre Schulungspflicht", fr: "Votre obligation de formation", it: "Il vostro obbligo di formazione", es: "Su obligación de formación", pl: "Twój obowiązek szkoleniowy" },
  moduleId: "module-1",
  order: 5,
  contentFile: "1-6",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 3,
  nextLessonId: "1.7",
  prevLessonId: "1.5",
});

export default lesson;
