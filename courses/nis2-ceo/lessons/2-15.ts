import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.15",
  slug: "measure-10-mfa",
  title: { en: "Measure 10 - Multi-Factor Authentication and Secured Communications", nl: "Maatregel 10 – Meervoudige authenticatie en beveiligde communicatie", de: "Maßnahme 10 – Mehrfaktorauthentifizierung und gesicherte Kommunikation", fr: "Mesure 10 - Authentification multifacteur et communications sécurisées", it: "Misura 10 - Autenticazione a più fattori e comunicazioni protette", es: "Medida 10 - Autenticación multifactor y comunicaciones seguras", pl: "Środek 10 - Uwierzytelnianie wieloskładnikowe i zabezpieczona komunikacja", cs: "Opatření 10 - Vícefaktorové ověřování a zabezpečená komunikace", pt: "Medida 10 - Autenticação multifator e comunicações seguras", ro: "Măsura 10 - Autentificarea multifactor și comunicațiile securizate" },
  moduleId: "module-2",
  order: 14,
  contentFile: "2-15",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "3.1",
  prevLessonId: "2.14",
});

export default lesson;
