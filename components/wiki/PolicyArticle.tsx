import { type ArticleCategory, type ArticlePage, articlePage } from "./WikiArticle";

/**
 * The policy guides: how to write the document a NIS 2 measure asks for, in the company's own
 * words and at its own size. Each page ends on the walkthrough step where the record is kept.
 */
const POLICIES: ArticleCategory = {
  topLevel: "richtlinien",
  namespace: "policyGuides",
  about: ["nis2", "bsig"],
  closing: "price",
};

export const policyPage = (page: ArticlePage) => articlePage(POLICIES, page);
