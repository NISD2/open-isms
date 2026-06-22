import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.9",
  slug: "supplier-breach-scenario",
  title: { en: "Scenario - Supplier Breach Affecting Your Customer Data", nl: "Scenario - Leveranciersincident met klantgegevens", de: "Szenario - Lieferantenvorfall mit Auswirkung auf Ihre Kundendaten", fr: "Scénario - Violation chez un fournisseur touchant vos données clients", it: "Scenario - Violazione presso un fornitore che riguarda i vostri dati clienti", es: "Escenario - Brecha en un proveedor que afecta a sus datos de clientes", pl: "Scenariusz - Naruszenie u dostawcy dotyczące Twoich danych klientów", cs: "Scénář - Narušení u dodavatele s dopadem na vaše zákaznická data", pt: "Cenário - Violação num fornecedor que afeta os dados dos seus clientes", ro: "Scenariu - Breșă la un furnizor care afectează datele clienților dumneavoastră" },
  moduleId: "module-3",
  order: 8,
  contentFile: "3-9",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: "3.10",
  prevLessonId: "3.8",
});

export default lesson;
