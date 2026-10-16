import { gdprPage } from "@/components/wiki/GdprArticle";

const page = gdprPage({
  slug: "ki-datenschutz-unternehmen",
  messages: "aiPrivacy",
  art: "10_1",
  shot: "assetList",
  steps: ["2.2", "5.1", "10.1"],
  level: "Beginner",
  audienceType: "Datenschutzbeauftragte und Geschäftsführung",
  citations: ["gdpr", "nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
