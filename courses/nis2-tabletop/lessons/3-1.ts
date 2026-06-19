import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.1",
  slug: "cadence-quiz-attestation",
  title: { en: "Annual Cadence, Final Quiz, and Attestation", de: "Jährliche Häufigkeit, Abschluss-Quiz und Teilnahmebescheinigung", fr: "Cadence annuelle, quiz final et attestation", it: "Cadenza annuale, quiz finale e attestato", es: "Cadencia anual, cuestionario final y certificado", pl: "Coroczny rytm, quiz końcowy i zaświadczenie" },
  moduleId: "final",
  order: 0,
  contentFile: "3-1",
  hasQuiz: true,
  estimatedMinutes: 7,
  nextLessonId: null,
  prevLessonId: "2.3",
});

export default lesson;
