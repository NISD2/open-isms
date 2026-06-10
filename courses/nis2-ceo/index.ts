import { courseSchema } from "@/lib/training/schemas";

const course = courseSchema.parse({
  id: "nis2-ceo",
  title: {
    en: "NIS2 Management Training",
    de: "NIS2 Geschäftsführer-Schulung",
    nl: "NIS2 Managementtraining",
  },
  description: {
    en: "Everything the NIS2 Directive requires a member of the management body to know - structured around the BSI's three competence areas and the ten Article 21 measures.",
    de: "Alles, was die NIS2-Richtlinie von einem Mitglied der Geschäftsleitung verlangt - strukturiert nach den drei Kompetenzfeldern des BSI und den zehn Maßnahmen aus Artikel 21.",
    nl: "Alles wat de NIS2-richtlijn vereist van een lid van het leidinggevend orgaan - gestructureerd rond de drie competentiegebieden en de tien maatregelen van Artikel 21.",
  },
  version: "2.0",
  modules: [
    {
      id: "foundation",
      title: { en: "Foundation", de: "Grundlagen", nl: "Inleiding" },
      order: 0,
      lessonIds: ["0.1"],
    },
    {
      id: "module-1",
      title: { en: "The Law", de: "Das Gesetz", nl: "De Wet" },
      order: 1,
      lessonIds: [
        "1.1", "1.2", "1.3", "1.4", "1.5", "1.6",
        "1.7", "1.8", "1.9", "1.10", "1.11", "1.12",
      ],
    },
    {
      id: "module-2",
      title: { en: "Risk and the 10 Measures", de: "Risiko und die 10 Maßnahmen", nl: "Risico en de 10 Maatregelen" },
      order: 2,
      lessonIds: [
        "2.1", "2.2", "2.3", "2.4", "2.5",
        "2.6", "2.7", "2.8", "2.9", "2.10",
        "2.11", "2.12", "2.13", "2.14", "2.15",
      ],
    },
    {
      id: "module-3",
      title: { en: "Decision Support", de: "Entscheidungshilfe", nl: "Beslissingsondersteuning" },
      order: 3,
      lessonIds: [
        "3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7",
        "3.8", "3.9", "3.10", "3.11",
      ],
    },
    {
      id: "module-4",
      title: { en: "Protection", de: "Schutz", nl: "Bescherming" },
      order: 4,
      lessonIds: ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6"],
    },
    {
      id: "final",
      title: { en: "Final", de: "Abschluss", nl: "Afsluiting" },
      order: 5,
      lessonIds: ["5.1", "5.2"],
    },
  ],
});

export default course;
