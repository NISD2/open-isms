import { gdprPage } from "@/components/wiki/GdprArticle";

const page = gdprPage({
  slug: "chatgpt-datenschutz",
  messages: "chatgptPrivacy",
  art: "10_1",
  shot: "assetList",
  steps: ["2.2", "5.1"],
  level: "Beginner",
  audienceType: "Datenschutzbeauftragte, Geschäftsführung und IT-Verantwortliche",
  citations: ["gdpr", "nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
