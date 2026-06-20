import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.7",
  slug: "bsi-audit-walkthrough",
  title: { en: "What Happens During a Regulator Audit", nl: "Wat er gebeurt tijdens een toezichtaudit", de: "Was bei einer behördlichen Prüfung passiert", fr: "Ce qui se passe lors d'un audit du régulateur", it: "Cosa accade durante un audit dell'autorità di vigilanza", es: "Qué ocurre durante una auditoría del regulador", pl: "Co dzieje się podczas kontroli organu nadzorczego", cs: "Co se děje během kontroly regulačního orgánu", pt: "O que acontece durante uma auditoria do regulador", ro: "Ce se întâmplă în timpul unui audit al autorității de reglementare" },
  moduleId: "module-3",
  order: 6,
  contentFile: "3-7",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: "3.8",
  prevLessonId: "3.6",
});

export default lesson;
