import { gdprPage } from "@/components/wiki/GdprArticle";

const page = gdprPage({
  slug: "datenschutzfolgenabschaetzung",
  messages: "dpia",
  art: "2_3",
  shot: "riskMap",
  steps: ["2.3"],
  level: "Intermediate",
  audienceType: "Datenschutzbeauftragte und CISO",
  citations: ["gdpr", "nis2"],
});

export const generateMetadata = page.metadata;
export default page.Page;
