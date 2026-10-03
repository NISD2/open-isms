/**
 * Keeps the asset and supplier registers up on their own pages, the way a company does next to
 * the walk: what each process and room is, owners and locations, server facts, the kind of each
 * supplier, contacts, access, certificates and contracts. Each row is opened with its edit button
 * and saved through the register's form (`e2e/lib/form-driver.ts`).
 *
 * Runs before management approves at 7.3: a register edit sends the requirements built on that
 * register back to waiting for approval (`invalidateModuleSignOffs`).
 */
import type { Page } from "@playwright/test";
import { introspectSchema } from "@/lib/forms/schema-introspect";
import { assetInsertSchema, supplierInsertSchema } from "@/schema/validators";
import { fillFields } from "../../e2e/lib/form-driver";
import { ASSET_DETAILS, SUPPLIER_DETAILS } from "./persona";
import { type Session, tap } from "./walk";

// drizzle-zod builds Zod v3 shapes; introspection takes the v4 type (lib/organization/constants).
type Schema = Parameters<typeof introspectSchema>[0];

/** Rows are found by a name the table shows; a name inside another one would open the wrong row. */
function assertDistinct(names: readonly string[]): void {
  const clash = names.find((a) => names.some((b) => a !== b && b.includes(a)));
  if (clash) throw new Error(`register name "${clash}" is part of another name`);
}

/** Opens a row's edit form and waits until the form shows that row. */
async function openRow(page: Page, name: string) {
  const row = page.locator("tr", { hasText: name }).first();
  await row.waitFor({ timeout: 30_000 });
  await tap(row.locator("button:has(svg.lucide-pencil)"));
  await page.waitForFunction(
    (shown) =>
      document.querySelector<HTMLInputElement>('[data-field="name"] input')?.value ===
      shown,
    name,
  );
}

async function keepRegister(
  session: Session,
  path: string,
  schema: Schema,
  details: Readonly<Record<string, Record<string, unknown>>>,
) {
  const { page } = session;
  const metas = introspectSchema(schema);
  assertDistinct(Object.keys(details));
  await page.goto(path);
  for (const [name, values] of Object.entries(details)) {
    await openRow(page, name);
    const filled = await fillFields(page, metas, values);
    const missing = Object.keys(values).filter((key) => !filled.includes(key));
    if (missing.length > 0)
      throw new Error(`${path} "${name}": the form has no field ${missing.join(", ")}`);
    await Promise.all([
      page.waitForResponse(
        (r) => r.request().method() === "POST" && r.url().includes(".update"),
        { timeout: 20_000 },
      ),
      page.getByTestId("schema-form-submit").click(),
    ]);
    await session.quiet();
  }
}

export async function keepRegisters(session: Session): Promise<void> {
  await keepRegister(
    session,
    "/assets",
    assetInsertSchema as unknown as Schema,
    ASSET_DETAILS,
  );
  await keepRegister(
    session,
    "/suppliers",
    supplierInsertSchema as unknown as Schema,
    SUPPLIER_DETAILS,
  );
}
