import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "4.3",
  slug: "cyber-vs-do",
  title: { en: "Cyber Insurance vs D&O - Different Products, Different Coverage", nl: "Cyberverzekering versus D&O – Verschillende producten, verschillende dekking", de: "Cyberversicherung vs. D&O – unterschiedliche Produkte, unterschiedliche Deckung", fr: "Assurance cyber vs D&O : produits différents, couvertures différentes", it: "Assicurazione cyber vs D&O: prodotti diversi, coperture diverse", es: "Seguro cibernético vs D&O: productos diferentes, coberturas diferentes", pl: "Ubezpieczenie cybernetyczne vs D&O: różne produkty, różne zakresy ochrony", cs: "Kybernetické pojištění vs D&O - jiné produkty, jiné krytí", pt: "Seguro cibernético vs D&O - produtos diferentes, coberturas diferentes", ro: "Asigurarea cibernetică vs D&O - produse diferite, acoperiri diferite" },
  moduleId: "module-4",
  order: 2,
  contentFile: "4-3",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "4.4",
  prevLessonId: "4.2",
});

export default lesson;
