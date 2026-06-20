import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.8",
  slug: "measure-3-bcm",
  title: { en: "Measure 3 - Business Continuity", nl: "Maatregel 3 – Bedrijfscontinuïteit", de: "Maßnahme 3 – Aufrechterhaltung des Betriebs", fr: "Mesure 3 - Continuité d'activité", it: "Misura 3 - Continuità operativa", es: "Medida 3 - Continuidad del negocio", pl: "Środek 3 - Ciągłość działania", cs: "Opatření 3 - Kontinuita činností", pt: "Medida 3 - Continuidade do negócio", ro: "Măsura 3 - Continuitatea activității" },
  moduleId: "module-2",
  order: 7,
  contentFile: "2-8",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.9",
  prevLessonId: "2.7",
});

export default lesson;
