import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "0.1",
  slug: "what-is-an-sbom",
  title: { en: "What an SBOM Is and Why CRA Made It Mandatory", de: "Was eine SBOM ist und warum der CRA sie vorschreibt", fr: "Ce qu'est un SBOM et pourquoi le CRA l'a rendu obligatoire", it: "Cos'è un SBOM e perché il CRA lo ha reso obbligatorio", es: "Qué es un SBOM y por qué el CRA lo hizo obligatorio", pl: "Czym jest SBOM i dlaczego CRA uczynił go obowiązkowym" },
  moduleId: "foundation",
  order: 0,
  contentFile: "0-1",
  hasQuiz: false,
  estimatedMinutes: 5,
  nextLessonId: "1.1",
  prevLessonId: null,
});

export default lesson;
