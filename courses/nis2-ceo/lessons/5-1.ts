import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "5.1",
  slug: "implementation-roadmap",
  title: { en: "Your First 90 Days After This Course", nl: "Uw eerste 90 dagen na deze cursus", de: "Ihre ersten 90 Tage nach diesem Kurs", fr: "Vos 90 premiers jours après ce cours", it: "I vostri primi 90 giorni dopo questo corso", es: "Sus primeros 90 días después de este curso", pl: "Twoje pierwsze 90 dni po tym kursie", cs: "Vašich prvních 90 dní po tomto kurzu", pt: "Os seus primeiros 90 dias após este curso", ro: "Primele dumneavoastră 90 de zile după acest curs" },
  moduleId: "final",
  order: 0,
  contentFile: "5-1",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "5.2",
  prevLessonId: "4.6",
});

export default lesson;
