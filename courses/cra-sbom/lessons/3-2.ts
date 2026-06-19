import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.2",
  slug: "maintaining-and-monitoring",
  title: { en: "Keeping Your SBOM Current and Monitoring for Vulnerabilities", de: "SBOM aktuell halten und Schwachstellen überwachen", fr: "Maintenir votre SBOM à jour et surveiller les vulnérabilités", it: "Mantenere aggiornato il vostro SBOM e monitorare le vulnerabilità", es: "Mantener su SBOM actualizado y vigilar las vulnerabilidades", pl: "Utrzymywanie aktualnego SBOM i monitorowanie podatności" },
  moduleId: "module-3",
  order: 1,
  contentFile: "3-2",
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: "4.1",
  prevLessonId: "3.1",
});

export default lesson;
