import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.9",
  slug: "supplier-breach-scenario",
  title: { en: "Scenario - Supplier Breach Affecting Your Customer Data", nl: "Scenario – Leveranciersincident met klantgegevens", de: "Szenario – Lieferantenvorfall mit Auswirkung auf Ihre Kundendaten" },
  moduleId: "module-3",
  order: 8,
  contentFile: "3-9",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: "3.10",
  prevLessonId: "3.8",
});

export default lesson;
