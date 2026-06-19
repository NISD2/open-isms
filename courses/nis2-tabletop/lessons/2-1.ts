import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.1",
  slug: "scenario-walkthrough",
  title: { en: "One End-to-End Scenario: Ransomware on the ERP", de: "Ein vollständiges Szenario: Ransomware im ERP-System", fr: "Un scénario de bout en bout : un rançongiciel sur l'ERP", it: "Uno scenario completo: ransomware sull'ERP", es: "Un escenario completo: ransomware en el ERP", pl: "Jeden kompletny scenariusz: ransomware w systemie ERP" },
  moduleId: "module-2",
  order: 0,
  contentFile: "2-1",
  hasQuiz: true,
  estimatedMinutes: 10,
  nextLessonId: "2.2",
  prevLessonId: "1.3",
});

export default lesson;
