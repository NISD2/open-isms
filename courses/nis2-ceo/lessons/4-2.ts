import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "4.2",
  slug: "do-insurance",
  title: { en: "D&O Insurance - What It Covers and the Cyber Exclusions", nl: "D&O-verzekering – Wat het dekt en de cyberuitzonderingen", de: "D&O-Versicherung – Was sie abdeckt und die Cyberausschlüsse", fr: "Assurance D&O : ce qu'elle couvre et les exclusions cyber", it: "Assicurazione D&O: cosa copre e le esclusioni cyber", es: "Seguro D&O: qué cubre y las exclusiones cibernéticas", pl: "Ubezpieczenie D&O: co obejmuje i wyłączenia cybernetyczne", cs: "Pojištění D&O - co kryje a kybernetické výluky", pt: "Seguro D&O - o que cobre e as exclusões cibernéticas", ro: "Asigurarea D&O - ce acoperă și excluderile cibernetice" },
  moduleId: "module-4",
  order: 1,
  contentFile: "4-2",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "4.3",
  prevLessonId: "4.1",
});

export default lesson;
