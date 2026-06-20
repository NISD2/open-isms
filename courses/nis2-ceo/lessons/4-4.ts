import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "4.4",
  slug: "policy-exclusions",
  title: { en: "Common Policy Exclusions to Read For", nl: "Veelvoorkomende polisuitsluitingen om op te letten", de: "Häufige Ausschlussklauseln, auf die Sie achten sollten", fr: "Exclusions de police courantes à surveiller", it: "Esclusioni di polizza comuni a cui prestare attenzione", es: "Exclusiones de póliza comunes a las que prestar atención", pl: "Typowe wyłączenia w polisie, na które należy zwrócić uwagę", cs: "Běžné výluky v pojistce, na které si dát pozor", pt: "Exclusões de apólice comuns a que estar atento", ro: "Excluderi de poliță frecvente la care să fiți atenți" },
  moduleId: "module-4",
  order: 3,
  contentFile: "4-4",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "4.5",
  prevLessonId: "4.3",
});

export default lesson;
