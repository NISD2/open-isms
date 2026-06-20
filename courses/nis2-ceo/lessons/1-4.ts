import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.4",
  slug: "registration",
  title: { en: "The Registration Obligation", nl: "De registratieplicht", de: "Die Registrierungspflicht", fr: "L'obligation d'enregistrement", it: "L'obbligo di registrazione", es: "La obligación de registro", pl: "Obowiązek rejestracji", cs: "Registrační povinnost", pt: "A obrigação de registo", ro: "Obligația de înregistrare" },
  moduleId: "module-1",
  order: 3,
  contentFile: "1-4",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 3,
  nextLessonId: "1.5",
  prevLessonId: "1.3",
});

export default lesson;
