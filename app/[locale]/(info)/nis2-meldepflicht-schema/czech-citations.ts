import { czechArticle } from "@/lib/compliance/czech-law";

/**
 * The schema's EU citations as a Czech reader writes them, article before instrument. The
 * package holds them in English; one it adds later reads through czechArticle until it is here.
 */
const CZECH_CITATION: Readonly<Record<string, string>> = {
  "Directive (EU) 2022/2555 (NIS 2) Art. 23": "čl. 23 směrnice (EU) 2022/2555 (NIS 2)",
  "Commission Implementing Regulation (EU) 2024/2690 (CIR)":
    "prováděcí nařízení Komise (EU) 2024/2690 (CIR)",
  "ENISA Technical Implementation Guidance v1.0 (June 2025)":
    "technické pokyny ENISA k provádění (Technical Implementation Guidance) v1.0, červen 2025",
  "NIS Cooperation Group Common Notification Templates (adopted 26 May 2026; Commission Implementing Regulation pending)":
    "společné šablony hlášení skupiny pro spolupráci NIS (přijaty 26. května 2026, prováděcí nařízení Komise se připravuje)",
  "W3C DPV NIS 2 Vocabulary v2.3 (25 February 2026)":
    "slovník W3C DPV pro NIS 2 v2.3 (25. února 2026)",
  "NIS 2 Art. 6(6)": "čl. 6 bod 6 NIS 2",
  "NIS 2 Art. 23(2)": "čl. 23 odst. 2 NIS 2",
  "NIS 2 Art. 23(3)": "čl. 23 odst. 3 NIS 2",
  "NIS 2 Art. 23(3)(a)": "čl. 23 odst. 3 písm. a) NIS 2",
  "NIS 2 Art. 23(4)": "čl. 23 odst. 4 NIS 2",
  "NIS 2 Art. 23(4)(a)": "čl. 23 odst. 4 písm. a) NIS 2",
  "NIS 2 Art. 23(4)(b)": "čl. 23 odst. 4 písm. b) NIS 2",
  "NIS 2 Art. 23(4)(d)": "čl. 23 odst. 4 písm. d) NIS 2",
  "NIS 2 Art. 23(4)(d)(i)": "čl. 23 odst. 4 písm. d) bod i) NIS 2",
  "NIS 2 Art. 23(4)(d)(ii)": "čl. 23 odst. 4 písm. d) bod ii) NIS 2",
  "NIS 2 Art. 23(4)(d)(iii)": "čl. 23 odst. 4 písm. d) bod iii) NIS 2",
  "NIS 2 Art. 23(4)(d)(iv)": "čl. 23 odst. 4 písm. d) bod iv) NIS 2",
  "NIS 2 Art. 23(5)": "čl. 23 odst. 5 NIS 2",
  "NIS 2 Art. 23(6)": "čl. 23 odst. 6 NIS 2",
  "NIS 2 Art. 30": "čl. 30 NIS 2",
  "NIS 2 Annex I": "příloha I NIS 2",
  "NIS 2 Annex II": "příloha II NIS 2",
  "CIR 2024/2690": "prováděcí nařízení (EU) 2024/2690",
  "CIR 2024/2690 (where applicable)":
    "prováděcí nařízení (EU) 2024/2690 (pokud se použije)",
  "ENISA TIG v1.0 §5 (incident timeline)":
    "ENISA TIG v1.0, oddíl 5 (časová osa incidentu)",
  "ENISA TIG v1.0 §5 (incident profiling)": "ENISA TIG v1.0, oddíl 5 (profil incidentu)",
  "ENISA TIG v1.0 §5 (detection)": "ENISA TIG v1.0, oddíl 5 (zjištění)",
  "ENISA TIG v1.0 §5 (post-incident review)":
    "ENISA TIG v1.0, oddíl 5 (přezkum po incidentu)",
  "ENISA TIG v1.0 §5 (notification logistics)":
    "ENISA TIG v1.0, oddíl 5 (organizace hlášení)",
  "GDPR Art. 32(1)": "čl. 32 odst. 1 GDPR",
  "GDPR Art. 33(1)": "čl. 33 odst. 1 GDPR",
  "GDPR Art. 33(3)(a)": "čl. 33 odst. 3 písm. a) GDPR",
  "GDPR Art. 33(3)(b)": "čl. 33 odst. 3 písm. b) GDPR",
  "GDPR Art. 33(3)(c)": "čl. 33 odst. 3 písm. c) GDPR",
  "GDPR Art. 33(3)(d)": "čl. 33 odst. 3 písm. d) GDPR",
  "GDPR Art. 34": "čl. 34 GDPR",
  "GDPR Art. 34(2)": "čl. 34 odst. 2 GDPR",
  "DORA Art. 19(1)": "čl. 19 odst. 1 DORA",
  "DORA Art. 19(4)": "čl. 19 odst. 4 DORA",
};

/** A citation as the reader's language writes it: Czech style on a Czech page, as stored elsewhere. */
export const citationFor = (citation: string, locale: string): string =>
  locale === "cs" ? (CZECH_CITATION[citation] ?? czechArticle(citation)) : citation;
