import { courseSchema } from "@/lib/training/schemas";

const course = courseSchema.parse({
  id: "cra-sbom",
  title: {
    en: "CRA SBOM Fundamentals",
    de: "CRA SBOM-Grundlagen",
  },
  description: {
    en: "Build, maintain, and retain the Software Bill of Materials the Cyber Resilience Act demands. Built for product managers, engineers, and security leads at companies selling products with digital elements into the EU. Covers Article 13(5) obligations, CycloneDX and SPDX formats, tooling, and the link to Article 14 vulnerability reporting.",
    de: "Erstellen, pflegen und archivieren Sie die Software-Stückliste, die der Cyber Resilience Act fordert. Für Produktmanager, Entwickler und Security-Leads in Unternehmen, die Produkte mit digitalen Elementen in der EU vertreiben. Deckt die Pflichten aus Artikel 13(5) ab, CycloneDX- und SPDX-Formate, Werkzeuge und den Bezug zur Schwachstellenmeldepflicht nach Artikel 14.",
  },
  version: "1.0",
  modules: [
    {
      id: "foundation",
      title: { en: "Foundation", de: "Grundlagen" },
      order: 0,
      lessonIds: ["0.1"],
    },
    {
      id: "module-1",
      title: { en: "What Goes Into an SBOM", de: "Was in eine SBOM gehört" },
      order: 1,
      lessonIds: ["1.1", "1.2", "1.3"],
    },
    {
      id: "module-2",
      title: { en: "Formats", de: "Formate" },
      order: 2,
      lessonIds: ["2.1", "2.2"],
    },
    {
      id: "module-3",
      title: { en: "Building and Maintaining Your SBOM", de: "SBOM erstellen und pflegen" },
      order: 3,
      lessonIds: ["3.1", "3.2"],
    },
    {
      id: "final",
      title: { en: "Final", de: "Abschluss" },
      order: 4,
      lessonIds: ["4.1"],
    },
  ],
});

export default course;
