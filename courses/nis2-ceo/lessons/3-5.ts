import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.5",
  slug: "what-you-cannot-delegate",
  title: { en: "What You Cannot Delegate - The Checklist", nl: "Wat u niet kunt delegeren – de checklist", de: "Was Sie nicht delegieren können – die Checkliste", fr: "Ce que vous ne pouvez pas déléguer - la checklist", it: "Ciò che non potete delegare - la checklist", es: "Lo que no puede delegar - la lista de verificación", pl: "Czego nie możesz delegować - lista kontrolna" },
  moduleId: "module-3",
  order: 4,
  contentFile: "3-5",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: "3.6",
  prevLessonId: "3.4",
});

export default lesson;
