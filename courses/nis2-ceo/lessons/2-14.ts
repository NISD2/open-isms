import { lessonSchema } from "@/lib/training/schemas";

const lesson = lessonSchema.parse({
  id: "2.14",
  slug: "measure-9-hr-access-assets",
  title: { en: "Measure 9 - HR Security, Access Control, and Asset Management", nl: "Maatregel 9 – HR-beveiliging, toegangscontrole en middelenbeheer", de: "Maßnahme 9 – Personalsicherheit, Zugriffskontrolle und Asset-Management", fr: "Mesure 9 - Sécurité RH, contrôle d'accès et gestion des actifs", it: "Misura 9 - Sicurezza delle risorse umane, controllo degli accessi e gestione degli asset", es: "Medida 9 - Seguridad de RR. HH., control de acceso y gestión de activos", pl: "Środek 9 - Bezpieczeństwo kadrowe, kontrola dostępu i zarządzanie aktywami" },
  moduleId: "module-2",
  order: 13,
  contentFile: "2-14",
  videoUrl: undefined,
  hasQuiz: true,
  estimatedMinutes: 5,
  nextLessonId: "2.15",
  prevLessonId: "2.13",
});

export default lesson;
