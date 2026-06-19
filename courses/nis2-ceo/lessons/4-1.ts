import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "4.1",
  slug: "insurance-not-substitute",
  title: { en: "Insurance Is Not a Substitute for Controls", nl: "Verzekering is geen vervanging voor maatregelen", de: "Versicherung ersetzt keine Maßnahmen", fr: "L'assurance ne remplace pas les mesures de sécurité", it: "L'assicurazione non sostituisce le misure di sicurezza", es: "El seguro no sustituye a las medidas de seguridad", pl: "Ubezpieczenie nie zastępuje środków bezpieczeństwa" },
  moduleId: "module-4",
  order: 0,
  contentFile: "4-1",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "4.2",
  prevLessonId: "3.11",
});

export default lesson;
