import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.9",
  slug: "ten-measures-overview",
  title: { en: "The Ten Measures: Overview", nl: "De tien maatregelen: overzicht", de: "Die zehn Maßnahmen: Überblick", fr: "Les dix mesures : vue d'ensemble", it: "Le dieci misure: panoramica", es: "Las diez medidas: visión general", pl: "Dziesięć środków: przegląd", cs: "Deset opatření: přehled", pt: "As dez medidas: visão geral", ro: "Cele zece măsuri: prezentare generală" },
  moduleId: "module-1",
  order: 8,
  contentFile: "1-9",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 2,
  nextLessonId: "1.10",
  prevLessonId: "1.8",
});

export default lesson;
