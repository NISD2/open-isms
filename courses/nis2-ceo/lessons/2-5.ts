import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.5",
  slug: "cia-business-impact",
  title: { en: "The CIA Triad and Business Impact", nl: "De CIA-driehoek en bedrijfsimpact", de: "Das CIA-Dreieck und geschäftliche Auswirkungen", fr: "La triade CIA et l'impact sur l'activité", it: "La triade CIA e l'impatto sul business", es: "La tríada CIA y el impacto en el negocio", pl: "Triada CIA i wpływ na działalność" },
  moduleId: "module-2",
  order: 4,
  contentFile: "2-5",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.6",
  prevLessonId: "2.4",
});

export default lesson;
