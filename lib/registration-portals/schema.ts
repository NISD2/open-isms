import { z } from "zod";

export const portalStatus = z.enum([
  "operational",
  "pre-registration",
  "planned",
  "not-yet-available",
]);

export const registrationPortalSchema = z.object({
  countryCode: z.string().length(2),
  authority: z.string(),
  authorityUrl: z.string().nullable(),
  portalName: z.string().nullable(),
  portalUrl: z.string().nullable(),
  status: portalStatus,
  registrationDeadline: z.string().nullable(),
  nationalLaw: z.string().nullable(),
  entryIntoForce: z.string().nullable(),
  notes: z.string(),
  notesDe: z.string(),
  lastVerified: z.string(),
  /**
   * Canonical wiki slug under /wiki/zeit-und-status/. When present, the
   * applicability callout renders a deep link to the per-country briefing.
   */
  wikiSlug: z.string().optional(),
  /**
   * National CSIRT(s). Acronym + parent organisation where useful.
   * Optional only because some Member States (e.g. EE, MT) share their
   * CSIRT with a parent agency and the line is identical to `authority`.
   */
  csirt: z.string().optional(),
  /**
   * Short status flag rendered under the act name in the wiki tracker
   * table — e.g. "Commission opened infringement procedure", "Entered
   * into force 18 October 2024". Sparse: only populated when there's
   * something newsworthy to surface in the table row.
   */
  trackerNoteEn: z.string().optional(),
  trackerNoteDe: z.string().optional(),
  trackerNoteFr: z.string().optional(),
  trackerNoteIt: z.string().optional(),
  trackerNoteEs: z.string().optional(),
  trackerNotePl: z.string().optional(),
  /**
   * Longer per-country notes, localized. `notes` (En) and `notesDe` are the
   * required base; fr/it/es/pl are optional and fall back to the En `notes`
   * field at the call site.
   */
  notesFr: z.string().optional(),
  notesIt: z.string().optional(),
  notesEs: z.string().optional(),
  notesPl: z.string().optional(),
});

export const registrationPortalsDataSchema = z.object({
  portals: z.array(registrationPortalSchema),
  lastUpdated: z.string(),
});

export type PortalStatus = z.infer<typeof portalStatus>;
export type RegistrationPortal = z.infer<typeof registrationPortalSchema>;
export type RegistrationPortalsData = z.infer<
  typeof registrationPortalsDataSchema
>;
