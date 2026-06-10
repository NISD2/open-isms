import { courseSchema } from "@/lib/training/schemas";

const course = courseSchema.parse({
  id: "nis2-tabletop",
  title: {
    en: "NIS 2 Tabletop Exercise Training",
    de: "NIS-2-Tabletop-Schulung",
  },
  description: {
    en: "Design, run, and document the annual exercise NIS 2 demands. Built for facilitators — information security officers, IT managers, and BCM leads who must run a tabletop that produces audit-grade evidence. EU-wide framing, with German transposition references.",
    de: "Planen, durchführen und dokumentieren Sie die jährliche Übung, die NIS 2 verlangt. Konzipiert für Moderatorinnen und Moderatoren: Informationssicherheits-Beauftragte, IT-Verantwortliche und Notfall- und Krisenmanagement-Leitungen, die eine auditfeste Tabletop-Übung durchführen müssen. EU-weit verständlich, mit Bezügen zur deutschen Umsetzung im BSIG.",
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
      title: { en: "Legal Basis and Setup", de: "Rechtliche Grundlage und Vorbereitung" },
      order: 1,
      lessonIds: ["1.1", "1.2", "1.3"],
    },
    {
      id: "module-2",
      title: { en: "Running and Closing the Exercise", de: "Durchführung und Abschluss der Übung" },
      order: 2,
      lessonIds: ["2.1", "2.2", "2.3"],
    },
    {
      id: "final",
      title: { en: "Final", de: "Abschluss" },
      order: 3,
      lessonIds: ["3.1"],
    },
  ],
});

export default course;
