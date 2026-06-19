import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "3.1",
  slug: "twelve-questions",
  title: { en: "The Questions Every CEO Must Answer", nl: "De vragen die elke CEO moet kunnen beantwoorden", de: "Die Fragen, die jeder Geschäftsführer beantworten muss", fr: "Les questions auxquelles chaque CEO doit répondre", it: "Le domande a cui ogni CEO deve rispondere", es: "Las preguntas que todo CEO debe responder", pl: "Pytania, na które musi odpowiedzieć każdy CEO" },
  moduleId: "module-3",
  order: 0,
  contentFile: "3-1",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 6,
  nextLessonId: "3.2",
  prevLessonId: "2.15",
});

export default lesson;
