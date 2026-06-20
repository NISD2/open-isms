import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "4.6",
  slug: "ransomware-payment",
  title: { en: "Ransomware Payment Decisions", nl: "Beslissingen over ransomwarebetaling", de: "Entscheidungen über Ransomware-Zahlungen", fr: "Décisions de paiement de rançongiciel", it: "Decisioni sul pagamento del ransomware", es: "Decisiones sobre el pago de ransomware", pl: "Decyzje dotyczące zapłaty okupu za ransomware", cs: "Rozhodování o zaplacení výkupného u ransomwaru", pt: "Decisões sobre o pagamento de ransomware", ro: "Decizii privind plata răscumpărării ransomware" },
  moduleId: "module-4",
  order: 5,
  contentFile: "4-6",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "5.1",
  prevLessonId: "4.5",
});

export default lesson;
