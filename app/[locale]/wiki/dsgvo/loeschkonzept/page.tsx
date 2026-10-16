import { gdprPage } from "@/components/wiki/GdprArticle";

const page = gdprPage({
  slug: "loeschkonzept",
  messages: "erasure",
  art: "4_4",
  shot: "path",
  steps: ["4.4"],
  level: "Intermediate",
  audienceType: "Datenschutzbeauftragte und IT-Verantwortliche",
  citations: ["gdpr", "nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
