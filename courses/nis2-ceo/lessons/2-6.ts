import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.6",
  slug: "measure-1-risk-policies",
  title: { en: "Measure 1 - Risk Analysis and Information Security Policies", nl: "Maatregel 1 – Risicoanalyse en informatiebeveiligingsbeleid", de: "Maßnahme 1 – Risikoanalyse und Informationssicherheitsleitlinien", fr: "Mesure 1 - Analyse des risques et politiques de sécurité de l'information", it: "Misura 1 - Analisi dei rischi e politiche di sicurezza delle informazioni", es: "Medida 1 - Análisis de riesgos y políticas de seguridad de la información", pl: "Środek 1 - Analiza ryzyka i polityki bezpieczeństwa informacji" },
  moduleId: "module-2",
  order: 5,
  contentFile: "2-6",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.7",
  prevLessonId: "2.5",
});

export default lesson;
