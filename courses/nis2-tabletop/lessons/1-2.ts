import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "1.2",
  slug: "role-assignments",
  title: { en: "Role Assignments: Who Must Be in the Room", de: "Rollen: Wer bei der Übung anwesend sein muss", fr: "Attribution des rôles : qui doit être présent", it: "Assegnazione dei ruoli: chi deve essere presente", es: "Asignación de funciones: quién debe estar presente", pl: "Przydział ról: kto musi być obecny", cs: "Rozdělení rolí: kdo musí být v místnosti", pt: "Atribuição de funções: quem deve estar presente", ro: "Atribuirea rolurilor: cine trebuie să fie prezent" },
  moduleId: "module-1",
  order: 1,
  contentFile: "1-2",
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "1.3",
  prevLessonId: "1.1",
});

export default lesson;
