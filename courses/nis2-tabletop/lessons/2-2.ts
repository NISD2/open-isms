import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.2",
  slug: "hot-wash-debrief",
  title: { en: "The Hot Wash Debrief", de: "Die Nachbesprechung (Hot Wash)", fr: "Le débriefing à chaud (hot wash)", it: "Il debriefing a caldo (hot wash)", es: "El balance en caliente (hot wash)", pl: "Omówienie na gorąco (hot wash)", cs: "Rozbor za tepla (hot wash)", pt: "O balanço a quente (hot wash)", ro: "Analiza la cald (hot wash)" },
  moduleId: "module-2",
  order: 1,
  contentFile: "2-2",
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.3",
  prevLessonId: "2.1",
});

export default lesson;
