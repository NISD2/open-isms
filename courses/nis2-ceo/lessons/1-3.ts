import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.3",
  slug: "penalties-manager-ban",
  title: {
    en: "Penalties and the Manager Ban",
    nl: "Sancties en het bestuursverbod",
    de: "Sanktionen und das Leitungsverbot",
    fr: "Sanctions et interdiction de diriger",
    it: "Sanzioni e divieto di dirigere",
    es: "Sanciones y la prohibición de dirigir",
    pl: "Sankcje i zakaz pełnienia funkcji kierowniczych",
    cs: "Sankce a zákaz výkonu řídicí funkce",
    pt: "Sanções e a proibição de exercer funções de direção",
    ro: "Sancțiunile și interdicția de a exercita funcții de conducere",
  },
  moduleId: "module-1",
  order: 2,
  contentFile: "1-3",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 3,
  nextLessonId: "1.4",
  prevLessonId: "1.2",
});

export default lesson;
