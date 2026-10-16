import { assistantPage } from "@/components/wiki/AssistantArticle";

const page = assistantPage({
  slug: "ki-anbieter-lieferant-nis2",
  messages: "assistantAsSupplier",
  art: "5_1",
  shot: "assetList",
  steps: ["2.2", "5.1", "5.2"],
  level: "Intermediate",
  audienceType: "CISO, Einkauf und IT-Verantwortliche",
  citations: ["nis2", "cir-2024-2690", "bsig"],
});

export const generateMetadata = page.metadata;
export default page.Page;
