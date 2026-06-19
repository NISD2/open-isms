import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.7",
  slug: "personal-liability",
  title: { en: "Personal Liability Under Your Country’s Corporate Law", nl: "Persoonlijke aansprakelijkheid onder het nationale vennootschapsrecht", de: "Persönliche Haftung nach nationalem Gesellschaftsrecht", fr: "Responsabilité personnelle au titre du droit national des sociétés", it: "Responsabilità personale ai sensi del diritto societario nazionale", es: "Responsabilidad personal según el derecho de sociedades nacional", pl: "Odpowiedzialność osobista na podstawie krajowego prawa spółek" },
  moduleId: "module-1",
  order: 6,
  contentFile: "1-7",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 2,
  nextLessonId: "1.8",
  prevLessonId: "1.6",
});

export default lesson;
