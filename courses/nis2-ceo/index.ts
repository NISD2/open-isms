import { courseSchema } from "@/lib/training/schemas";

const course = courseSchema.parse({
  id: "nis2-ceo",
  title: {
    en: "NIS2 Management Training",
    de: "NIS2 Geschäftsführer-Schulung",
    nl: "NIS2 Managementtraining",
    fr: "Formation NIS2 pour la direction",
    it: "Formazione NIS2 per la dirigenza",
    es: "Formación NIS2 para la dirección",
    pl: "Szkolenie NIS2 dla kadry zarządzającej",
  },
  description: {
    en: "Everything the NIS2 Directive requires a member of the management body to know - structured around the BSI's three competence areas and the ten Article 21 measures.",
    de: "Alles, was die NIS2-Richtlinie von einem Mitglied der Geschäftsleitung verlangt - strukturiert nach den drei Kompetenzfeldern des BSI und den zehn Maßnahmen aus Artikel 21.",
    nl: "Alles wat de NIS2-richtlijn vereist van een lid van het leidinggevend orgaan - gestructureerd rond de drie competentiegebieden en de tien maatregelen van Artikel 21.",
    fr: "Tout ce que la directive NIS2 exige d'un membre de l'organe de direction - structuré autour des trois domaines de compétence du BSI et des dix mesures de l'article 21.",
    it: "Tutto ciò che la direttiva NIS2 richiede a un membro dell'organo di gestione - strutturato attorno alle tre aree di competenza del BSI e alle dieci misure dell'articolo 21.",
    es: "Todo lo que la Directiva NIS2 exige que conozca un miembro del órgano de dirección - estructurado en torno a las tres áreas de competencia del BSI y las diez medidas del artículo 21.",
    pl: "Wszystko, co dyrektywa NIS2 wymaga od członka organu zarządzającego - uporządkowane według trzech obszarów kompetencji BSI oraz dziesięciu środków z artykułu 21.",
  },
  version: "2.0",
  modules: [
    {
      id: "foundation",
      title: {
        en: "Foundation",
        de: "Grundlagen",
        nl: "Inleiding",
        fr: "Fondations",
        it: "Fondamenti",
        es: "Fundamentos",
        pl: "Podstawy",
      },
      order: 0,
      lessonIds: ["0.1"],
    },
    {
      id: "module-1",
      title: {
        en: "The Law",
        de: "Das Gesetz",
        nl: "De Wet",
        fr: "La loi",
        it: "La legge",
        es: "La ley",
        pl: "Prawo",
      },
      order: 1,
      lessonIds: [
        "1.1", "1.2", "1.3", "1.4", "1.5", "1.6",
        "1.7", "1.8", "1.9", "1.10", "1.11", "1.12",
      ],
    },
    {
      id: "module-2",
      title: {
        en: "Risk and the 10 Measures",
        de: "Risiko und die 10 Maßnahmen",
        nl: "Risico en de 10 Maatregelen",
        fr: "Le risque et les 10 mesures",
        it: "Il rischio e le 10 misure",
        es: "El riesgo y las 10 medidas",
        pl: "Ryzyko i 10 środków",
      },
      order: 2,
      lessonIds: [
        "2.1", "2.2", "2.3", "2.4", "2.5",
        "2.6", "2.7", "2.8", "2.9", "2.10",
        "2.11", "2.12", "2.13", "2.14", "2.15",
      ],
    },
    {
      id: "module-3",
      title: {
        en: "Decision Support",
        de: "Entscheidungshilfe",
        nl: "Beslissingsondersteuning",
        fr: "Aide à la décision",
        it: "Supporto alle decisioni",
        es: "Apoyo a la decisión",
        pl: "Wsparcie decyzji",
      },
      order: 3,
      lessonIds: [
        "3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7",
        "3.8", "3.9", "3.10", "3.11",
      ],
    },
    {
      id: "module-4",
      title: {
        en: "Protection",
        de: "Schutz",
        nl: "Bescherming",
        fr: "Protection",
        it: "Protezione",
        es: "Protección",
        pl: "Ochrona",
      },
      order: 4,
      lessonIds: ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6"],
    },
    {
      id: "final",
      title: {
        en: "Final",
        de: "Abschluss",
        nl: "Afsluiting",
        fr: "Conclusion",
        it: "Conclusione",
        es: "Cierre",
        pl: "Podsumowanie",
      },
      order: 5,
      lessonIds: ["5.1", "5.2"],
    },
  ],
});

export default course;
