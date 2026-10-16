import { gdprPage } from "@/components/wiki/GdprArticle";

const page = gdprPage({
  slug: "toms-dsgvo",
  messages: "toms",
  art: "9_1",
  shot: "export",
  steps: ["9.1", "4.4", "4.2"],
  level: "Intermediate",
  audienceType: "Datenschutzbeauftragte, IT-Verantwortliche und CISO",
  citations: ["gdpr", "nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
