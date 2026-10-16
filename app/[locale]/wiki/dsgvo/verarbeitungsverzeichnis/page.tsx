import { gdprPage } from "@/components/wiki/GdprArticle";

const page = gdprPage({
  slug: "verarbeitungsverzeichnis",
  messages: "ropa",
  art: "2_2",
  shot: "assetList",
  steps: ["2.2"],
  level: "Beginner",
  audienceType: "Datenschutzbeauftragte und IT-Verantwortliche",
  citations: ["gdpr", "nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
