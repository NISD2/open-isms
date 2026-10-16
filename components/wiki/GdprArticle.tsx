import { type ArticleCategory, type ArticlePage, articlePage } from "./WikiArticle";

/**
 * The DSGVO category: what the GDPR asks of a company, answered for a company. nisd2.eu does not
 * cover the GDPR today, so its pages end on the DSGVO Durchgang's waitlist, not on a price.
 */
const DSGVO: ArticleCategory = {
  topLevel: "dsgvo",
  namespace: "gdpr",
  about: ["gdpr"],
  closing: "waitlist",
};

export const gdprPage = (page: ArticlePage) => articlePage(DSGVO, page);
