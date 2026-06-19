import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.6",
  slug: "ciso-board-reporting",
  title: { en: "CISO and Supervisory Board Reporting Lines", nl: "CISO en rapportagelijnen van de raad van commissarissen", de: "CISO und Berichtslinien zum Aufsichtsrat", fr: "CISO et lignes de reporting vers le conseil de surveillance", it: "CISO e linee di reporting verso il consiglio di sorveglianza", es: "CISO y líneas de reporte hacia el consejo de supervisión", pl: "CISO i linie raportowania do rady nadzorczej" },
  moduleId: "module-3",
  order: 5,
  contentFile: "3-6",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "3.7",
  prevLessonId: "3.5",
});

export default lesson;
