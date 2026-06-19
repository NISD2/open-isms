import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.3",
  slug: "penalties-manager-ban",
  title: { en: "Penalties and the Article 34 Manager Ban", nl: "Sancties en het bestuursverbod van Artikel 34", de: "Sanktionen und das Leitungsverbot nach Artikel 34", fr: "Sanctions et interdiction de diriger prévue à l'article 34", it: "Sanzioni e divieto di dirigere ai sensi dell'articolo 34", es: "Sanciones y la prohibición de dirigir del artículo 34", pl: "Sankcje i zakaz pełnienia funkcji kierowniczych z artykułu 34" },
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
