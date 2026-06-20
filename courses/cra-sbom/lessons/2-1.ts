import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.1",
  slug: "cyclonedx",
  title: { en: "CycloneDX: The Security-Focused SBOM Format", de: "CycloneDX: Das sicherheitsorientierte SBOM-Format", fr: "CycloneDX : le format SBOM axé sur la sécurité", it: "CycloneDX: il formato SBOM orientato alla sicurezza", es: "CycloneDX: el formato SBOM orientado a la seguridad", pl: "CycloneDX: format SBOM zorientowany na bezpieczeństwo", cs: "CycloneDX: formát SBOM zaměřený na bezpečnost", pt: "CycloneDX: o formato SBOM orientado para a segurança", ro: "CycloneDX: formatul SBOM orientat spre securitate" },
  moduleId: "module-2",
  order: 0,
  contentFile: "2-1",
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: "2.2",
  prevLessonId: "1.3",
});

export default lesson;
