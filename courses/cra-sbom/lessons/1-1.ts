import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.1",
  slug: "what-goes-into-an-sbom",
  title: { en: "What Goes Into an SBOM: Components, Versions, and Identifiers", de: "Was in eine SBOM gehört: Komponenten, Versionen und Bezeichner", fr: "Ce que contient un SBOM : composants, versions et identifiants", it: "Cosa contiene un SBOM: componenti, versioni e identificatori", es: "Qué contiene un SBOM: componentes, versiones e identificadores", pl: "Co wchodzi w skład SBOM: komponenty, wersje i identyfikatory" },
  moduleId: "module-1",
  order: 0,
  contentFile: "1-1",
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: "1.2",
  prevLessonId: "0.1",
});

export default lesson;
