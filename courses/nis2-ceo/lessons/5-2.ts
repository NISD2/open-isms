import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "5.2",
  slug: "certificate-of-completion",
  title: { en: "Certificate of Completion", nl: "Eindexamen en certificaat van voltooiing", de: "Abschlussprüfung und Zertifikat", fr: "Certificat de réussite", it: "Certificato di completamento", es: "Certificado de finalización", pl: "Certyfikat ukończenia", cs: "Osvědčení o absolvování", pt: "Certificado de conclusão", ro: "Certificat de absolvire" },
  moduleId: "final",
  order: 1,
  contentFile: "5-2",
  videoUrl: undefined,
  hasQuiz: false,
  estimatedMinutes: 4,
  nextLessonId: null,
  prevLessonId: "5.1",
});

export default lesson;
