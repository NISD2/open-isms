import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.9",
  slug: "measure-4-supply-chain",
  title: { en: "Measure 4 - Supply Chain Security", nl: "Maatregel 4 – Beveiliging van de toeleveringsketen", de: "Maßnahme 4 – Sicherheit der Lieferkette", fr: "Mesure 4 - Sécurité de la chaîne d'approvisionnement", it: "Misura 4 - Sicurezza della catena di approvvigionamento", es: "Medida 4 - Seguridad de la cadena de suministro", pl: "Środek 4 - Bezpieczeństwo łańcucha dostaw" },
  moduleId: "module-2",
  order: 8,
  contentFile: "2-9",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "2.10",
  prevLessonId: "2.8",
});

export default lesson;
