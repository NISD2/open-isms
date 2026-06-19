import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.13",
  slug: "measure-8-cryptography",
  title: { en: "Measure 8 - Cryptography", nl: "Maatregel 8 – Cryptografie", de: "Maßnahme 8 – Kryptografie", fr: "Mesure 8 - Cryptographie", it: "Misura 8 - Crittografia", es: "Medida 8 - Criptografía", pl: "Środek 8 - Kryptografia" },
  moduleId: "module-2",
  order: 12,
  contentFile: "2-13",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.14",
  prevLessonId: "2.12",
});

export default lesson;
