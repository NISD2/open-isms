import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.2",
  slug: "top-level-vs-transitive-dependencies",
  title: { en: "Top-Level vs Transitive Dependencies", de: "Direkte vs. transitive Abhängigkeiten", fr: "Dépendances de premier niveau vs dépendances transitives", it: "Dipendenze di primo livello vs dipendenze transitive", es: "Dependencias de primer nivel vs dependencias transitivas", pl: "Zależności bezpośrednie vs zależności przechodnie", cs: "Přímé vs tranzitivní závislosti", pt: "Dependências de primeiro nível vs dependências transitivas", ro: "Dependențe de prim nivel vs dependențe tranzitive" },
  moduleId: "module-1",
  order: 1,
  contentFile: "1-2",
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "1.3",
  prevLessonId: "1.1",
});

export default lesson;
