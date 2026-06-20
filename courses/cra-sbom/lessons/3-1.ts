import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.1",
  slug: "building-your-sbom",
  title: { en: "Building Your SBOM: Tools and Pipeline Integration", de: "SBOM erstellen: Werkzeuge und Pipeline-Integration", fr: "Créer votre SBOM : outils et intégration dans le pipeline", it: "Creare il vostro SBOM: strumenti e integrazione nella pipeline", es: "Crear su SBOM: herramientas e integración en el pipeline", pl: "Tworzenie SBOM: narzędzia i integracja z pipeline", cs: "Vytvoření SBOM: nástroje a integrace do pipeline", pt: "Criar o seu SBOM: ferramentas e integração na pipeline", ro: "Crearea SBOM: instrumente și integrare în pipeline" },
  moduleId: "module-3",
  order: 0,
  contentFile: "3-1",
  hasQuiz: true,
  estimatedMinutes: 8,
  nextLessonId: "3.2",
  prevLessonId: "2.2",
});

export default lesson;
