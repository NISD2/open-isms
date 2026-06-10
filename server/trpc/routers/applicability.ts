import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../init";
import { TRPCError } from "@trpc/server";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { applicabilityLookup, lead } from "@/schema";
import { mapWzCodesToNis2 } from "@/lib/applicability/wz-to-nis2";
import { SECTORS, type SpecialCaseId } from "@/lib/applicability/sectors";
import { classify, type CompanySize } from "@/lib/applicability/classify";
import { rateLimit } from "@/lib/rate-limit";

const RAPIDAPI_HOST = "german-company-data.p.rapidapi.com";

type ImplisenseCompany = {
  id: string;
  name: string;
  street: string;
  zip: string;
  city: string;
  active: boolean;
  legalForm: string;
  purpose: string | null;
  capital: string | null;
  foundingDate: number | null;
  size: { code: string; name: string } | null;
  revenue: { code: string; name: string } | null;
  industries: {
    wz2008: Array<{ type: string; code: string; title: string }>;
    nace: Array<{ type: string; code: string; title: string }>;
  } | null;
  externalIds: {
    hr?: { court: string; type: string; number: string };
    vat?: string;
  } | null;
  phone: string | null;
  email: string | null;
  url: string | null;
};

function implisenseSizeToCompanySize(
  sizeCode: string | undefined,
): CompanySize | undefined {
  switch (sizeCode) {
    case "LARGE":
      return "large";
    case "MEDIUM":
      return "medium";
    case "SMALL":
    case "MICRO":
      return "small";
    default:
      return undefined;
  }
}

type ImplisenseSearchResult = {
  companies: Array<{
    id: string;
    name: string;
    street: string;
    zip: string;
    city: string;
    active: boolean;
  }>;
};

/** 30 days in ms — cache expiry for paid API responses */
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Detect holding/group parent companies that may have independently applicable subsidiaries */
function detectHolding(company: ImplisenseCompany): boolean {
  const wzCodes = company.industries?.wz2008?.map((i) => i.code) ?? [];
  // WZ 64.20 = holding companies, 70.10 = head office management
  if (wzCodes.some((c) => c === "64.20" || c === "70.10")) return true;

  const name = company.name.toLowerCase();
  const holdingPatterns = [
    "holding", "beteiligung", "verwaltungsgesellschaft",
    " gruppe ", " group ", "konzern",
  ];
  // Check name ends with or contains holding patterns
  return holdingPatterns.some((p) => name.includes(p));
}

function processCompanyData(company: ImplisenseCompany) {
  const wzCodes = company.industries?.wz2008?.map((i) => i.code) ?? [];
  const wzMatches = mapWzCodesToNis2(wzCodes);

  const sectorSet = new Map<string, "I" | "II">();
  for (const match of wzMatches) {
    const sector = SECTORS.find((s) => s.id === match.sectorId);
    if (sector) sectorSet.set(sector.id, sector.annex);
  }

  const sectors = [...sectorSet.entries()].map(([sectorId, annex]) => ({
    sectorId,
    annex,
  }));

  const size = implisenseSizeToCompanySize(company.size?.code);

  // Auto-detect special cases from WZ-mapped subsectors
  const TELECOM_SUBSECTORS = ["digital_telecom_networks", "digital_telecom_services"];
  const specialCases: SpecialCaseId[] = [];
  if (wzMatches.some((m) => m.subSectorId && TELECOM_SUBSECTORS.includes(m.subSectorId))) {
    specialCases.push("telecom_provider");
  }

  const classification = classify({
    excluded: false,
    sectors,
    specialCases,
    size,
  });

  return {
    company: {
      id: company.id,
      name: company.name,
      legalForm: company.legalForm,
      address: `${company.street}, ${company.zip} ${company.city}`,
      city: company.city,
      purpose: company.purpose,
      capital: company.capital,
      foundingDate: company.foundingDate,
      register: company.externalIds?.hr ?? null,
      wzCodes,
      wzDetails: company.industries?.wz2008 ?? [],
    },
    financials: {
      size: company.size,
      revenue: company.revenue,
    },
    nis2: {
      sectors: wzMatches.map((m) => {
        const sector = SECTORS.find((s) => s.id === m.sectorId);
        return {
          sectorId: m.sectorId,
          subSectorId: m.subSectorId,
          wzCode: m.wzCode,
          name: sector?.name ?? { en: m.sectorId, de: m.sectorId },
          annex: (sector?.annex ?? "II") as "I" | "II",
        };
      }),
      size: size ?? null,
      classification,
      isHolding: detectHolding(company),
      dataMissing: {
        sectors: wzCodes.length === 0,
        size: company.size === null,
        revenue: company.revenue === null,
      },
    },
  };
}

export const applicabilityRouter = router({
  search: publicProcedure
    .input(z.object({ name: z.string().min(2).max(200) }))
    .query(async ({ ctx, input }) => {
      // Per-IP rate limit — these endpoints are unauthenticated and call out
      // to a paid third-party API (RapidAPI). Without a limit a single client
      // could burn our quota and balloon the applicability_lookup table with
      // arbitrary German company records. 30 searches/min/IP is plenty for a
      // human filling out the applicability check form.
      if (!rateLimit(`applicability:search:${ctx.ip}`, 30, 60_000)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many lookups. Please wait a minute and try again.",
        });
      }

      const apiKey = env.RAPIDAPI_KEY;

      let companies: ImplisenseSearchResult["companies"] = [];

      // Use RapidAPI autocomplete (returns multiple results) if key available
      if (apiKey) {
        const res = await fetch(
          `https://${RAPIDAPI_HOST}/companies/autocomplete?query=${encodeURIComponent(input.name)}`,
          {
            headers: {
              "x-rapidapi-host": RAPIDAPI_HOST,
              "x-rapidapi-key": apiKey,
            },
            next: { revalidate: 86400 },
          },
        );

        if (res.ok) {
          const data = (await res.json()) as ImplisenseSearchResult;
          companies = data.companies.filter((c) => c.active).slice(0, 5);
        }
      }

      // Fallback: free implisen.se (returns 1 result, no key needed)
      if (companies.length === 0) {
        const res = await fetch(
          `https://implisen.se/${encodeURIComponent(input.name)}`,
          { next: { revalidate: 86400 } },
        );

        if (res.ok) {
          const data = (await res.json()) as ImplisenseSearchResult;
          companies = data.companies.filter((c) => c.active);
        }
      }

      // Insert each result if not already cached. We deliberately do NOT
      // overwrite searchQuery on conflict — the row's searchQuery column
      // would otherwise leak across users (whoever searched last would
      // overwrite the existing query string). The companyId is the natural
      // key, so re-searching the same company is a no-op cache touch.
      for (const c of companies) {
        db.insert(applicabilityLookup)
          .values({
            searchQuery: input.name,
            companyId: c.id,
            companyName: c.name,
          })
          .onConflictDoNothing({ target: applicabilityLookup.companyId })
          .catch(() => {});
      }

      return { companies };
    }),

  lookup: publicProcedure
    .input(
      z.object({
        id: z.string().min(2).max(100),
        searchQuery: z.string().max(200),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Per-IP rate limit. Lookups hit the paid API on cache miss, so this
      // is an even more sensitive surface than `search`.
      if (!rateLimit(`applicability:lookup:${ctx.ip}`, 30, 60_000)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many lookups. Please wait a minute and try again.",
        });
      }

      // Check DB cache first
      const cached = await db.query.applicabilityLookup.findFirst({
        where: eq(applicabilityLookup.companyId, input.id),
      });

      if (
        cached?.apiResponse &&
        cached.lookedUpAt &&
        Date.now() - cached.lookedUpAt.getTime() < CACHE_TTL_MS
      ) {
        return processCompanyData(cached.apiResponse as unknown as ImplisenseCompany);
      }

      // Cache miss — call paid API
      const apiKey = env.RAPIDAPI_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Company lookup is not configured",
        });
      }

      const res = await fetch(
        `https://${RAPIDAPI_HOST}/companies/${encodeURIComponent(input.id)}/data`,
        {
          headers: {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": apiKey,
          },
          next: { revalidate: 86400 },
        },
      );

      if (!res.ok) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }

      const company = (await res.json()) as ImplisenseCompany;
      const result = processCompanyData(company);

      // Cache the API response. We refresh classification/apiResponse/
      // lookedUpAt on conflict (these are derived from the API and the same
      // for everyone), but we deliberately do NOT touch searchQuery — that
      // column would otherwise leak the previous searcher's query string
      // to the next caller via subsequent reads of the row.
      db.insert(applicabilityLookup)
        .values({
          searchQuery: input.searchQuery,
          companyId: company.id,
          companyName: company.name,
          classification: result.nis2.classification.classification,
          apiResponse: company as unknown as Record<string, unknown>,
          lookedUpAt: new Date(),
        })
        .onConflictDoUpdate({
          target: applicabilityLookup.companyId,
          set: {
            companyName: company.name,
            classification: result.nis2.classification.classification,
            apiResponse: company as unknown as Record<string, unknown>,
            lookedUpAt: new Date(),
          },
        })
        .catch(() => {});

      return result;
    }),

  captureLead: publicProcedure
    .input(
      z.object({
        email: z.email(),
        companyName: z.string().max(500).optional(),
        classification: z.string().max(50).optional(),
        source: z.string().max(100).default("applicability_check"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Per-IP rate limit — public PII ingestion endpoint, an attacker could
      // otherwise spam the leads table with fabricated email addresses.
      if (!rateLimit(`applicability:lead:${ctx.ip}`, 5, 60_000)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many submissions. Please wait a minute and try again.",
        });
      }

      await db.insert(lead).values({
        email: input.email,
        companyName: input.companyName ?? null,
        classification: input.classification ?? null,
        source: input.source,
      });
      return { ok: true };
    }),
});
