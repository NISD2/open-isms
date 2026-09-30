/**
 * The shapes we read from Implisense (German company data, through RapidAPI and the free
 * implisen.se search). A leaf, so the checks are testable without the database or the environment.
 */
import { z } from "zod";

/**
 * Implisense's company id: "DE" and ten capitals or digits, e.g. DEPIYX8Y4M82. The id goes into a
 * URL path on the vendor's host with our key attached, so anything looser, "." or ".." above all,
 * would send that key to a different endpoint of the same API.
 */
export const implisenseIdSchema = z.string().regex(/^DE[A-Z0-9]{10}$/);

export const implisenseSearchSchema = z.object({
  companies: z.array(
    z.object({
      id: implisenseIdSchema,
      name: z.string(),
      street: z.string(),
      zip: z.string(),
      city: z.string(),
      active: z.boolean(),
    }),
  ),
});

const codeAndName = z.object({ code: z.string(), name: z.string() });

/** Only the fields the applicability check reads; anything else in the answer is dropped. */
export const implisenseCompanySchema = z.object({
  id: implisenseIdSchema,
  name: z.string(),
  street: z.string(),
  zip: z.string(),
  city: z.string(),
  legalForm: z.string(),
  purpose: z.string().nullable(),
  capital: z.string().nullable(),
  foundingDate: z.number().nullable(),
  size: codeAndName.nullable(),
  revenue: codeAndName.nullable(),
  industries: z
    .object({
      wz2008: z.array(
        z.object({ type: z.string(), code: z.string(), title: z.string() }),
      ),
    })
    .nullable(),
  externalIds: z
    .object({
      hr: z
        .object({ court: z.string(), type: z.string(), number: z.string() })
        .optional(),
    })
    .nullable(),
});

export type ImplisenseSearchResult = z.infer<typeof implisenseSearchSchema>;
export type ImplisenseCompany = z.infer<typeof implisenseCompanySchema>;

/**
 * A vendor's answer in the shape we read, or null when it failed, is not JSON, or is some other
 * shape. A 200 carrying an HTML error page is a failure, not data.
 */
export async function readVendorJson<S extends z.ZodType>(
  res: Response,
  schema: S,
): Promise<z.output<S> | null> {
  if (!res.ok) return null;
  const body: unknown = await res.json().catch(() => undefined);
  const parsed = schema.safeParse(body);
  return parsed.success ? parsed.data : null;
}
