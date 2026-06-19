import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.10",
  slug: "measure-5-acquisition",
  title: { en: "Measure 5 - Acquisition, Development, and Maintenance", nl: "Maatregel 5 – Aanschaf, ontwikkeling en onderhoud", de: "Maßnahme 5 – Beschaffung, Entwicklung und Wartung", fr: "Mesure 5 - Acquisition, développement et maintenance", it: "Misura 5 - Acquisizione, sviluppo e manutenzione", es: "Medida 5 - Adquisición, desarrollo y mantenimiento", pl: "Środek 5 - Nabywanie, rozwój i utrzymanie" },
  moduleId: "module-2",
  order: 9,
  contentFile: "2-10",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.11",
  prevLessonId: "2.9",
});

export default lesson;
