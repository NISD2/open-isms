import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.3",
  slug: "when-to-re-sign-off",
  title: { en: "When to Re-Sign-Off", nl: "Wanneer u opnieuw goedkeuring moet geven", de: "Wann eine erneute Freigabe erforderlich ist", fr: "Quand revalider", it: "Quando ripetere l'approvazione", es: "Cuándo volver a aprobar", pl: "Kiedy ponownie zatwierdzić", cs: "Kdy znovu schválit", pt: "Quando voltar a aprovar", ro: "Când se aprobă din nou" },
  moduleId: "module-3",
  order: 2,
  contentFile: "3-3",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "3.4",
  prevLessonId: "3.2",
});

export default lesson;
