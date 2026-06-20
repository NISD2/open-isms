import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.10",
  slug: "all-hazards-state-of-art",
  title: { en: "All-Hazards Approach and State of the Art", nl: "All-hazards benadering en stand van de techniek", de: "Gefahrenübergreifender Ansatz und Stand der Technik", fr: "Approche tous risques et état de l'art", it: "Approccio multirischio e stato dell'arte", es: "Enfoque de todos los riesgos y estado de la técnica", pl: "Podejście uwzględniające wszystkie zagrożenia i stan techniki", cs: "Přístup zohledňující všechna rizika a stav techniky", pt: "Abordagem de todos os riscos e estado da arte", ro: "Abordarea tuturor pericolelor și stadiul actual al tehnicii" },
  moduleId: "module-1",
  order: 9,
  contentFile: "1-10",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 3,
  nextLessonId: "1.11",
  prevLessonId: "1.9",
});

export default lesson;
