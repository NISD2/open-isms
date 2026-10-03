/**
 * A filled-in walkthrough to look at, on your own machine: creates the demo company of
 * ./persona.ts in the local database, then walks the whole NIS 2 walkthrough for it in a visible
 * browser against the local dev server, as a customer would.
 *
 *   bun dev                 # in another terminal, on http://localhost:3026
 *   bun run demo:walk       # add --headless to run without a window
 *
 * Re-running starts over: the previous demo company is erased first. Sign in afterwards as
 * it@kemper-lohse.example (IT lead, did the walk) or gf@kemper-lohse.example (management, approved),
 * with the public harness password E2E_USER_PASSWORD from e2e/lib/env.ts.
 *
 * Local only: the database and the app must both be on localhost.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { type AnyItem, walkOf } from "@/lib/durchgang";
import { company } from "@/schema";
import { E2E_USER_PASSWORD } from "../../e2e/lib/env";
import { COMPANY, IT_LEAD, MANAGEMENT } from "./persona";
import { keepRegisters } from "./registers";
import { seedDemoCompany } from "./seed";
import { startWalk, walkItems } from "./walk";

const LOCAL_HOSTS: readonly string[] = ["localhost", "127.0.0.1"];
const BASE_URL = process.env.DEMO_BASE_URL ?? "http://localhost:3026";
const HEADLESS = process.argv.includes("--headless");

const isLocal = (url: string | undefined): boolean => {
  try {
    return url !== undefined && LOCAL_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
};

/**
 * The database is local by the host Postgres connects to: node-postgres lets a `host` query
 * parameter override the URL's host, so that one is checked too (a socket path is local).
 */
const isLocalDatabase = (url: string | undefined): boolean => {
  if (!url || !isLocal(url)) return false;
  const params = new URL(url).searchParams;
  return ["host", "hostaddr"].every((key) => {
    const value = params.get(key);
    return value === null || value.startsWith("/") || LOCAL_HOSTS.includes(value);
  });
};

async function run(): Promise<void> {
  if (!isLocalDatabase(process.env.DATABASE_URL))
    throw new Error("Refusing to run: DATABASE_URL does not point at localhost.");
  if (!isLocal(BASE_URL))
    throw new Error(`Refusing to run: ${BASE_URL} is not localhost.`);

  console.log(`Creating ${COMPANY.name} ...`);
  const { companyId } = await seedDemoCompany(E2E_USER_PASSWORD);
  const facts = await db.query.company.findFirst({
    where: eq(company.id, companyId),
    columns: { entityType: true, criticalInstallation: true },
  });
  if (!facts) throw new Error("the demo company was not created");

  // The registers are kept up before management approves, as a register edit would send the
  // approved requirements back to waiting (./registers.ts).
  const items = walkOf(facts);
  const approves = (item: AnyItem) => item.screens.some((s) => s.kind === "approve");
  console.log(`Walking it on ${BASE_URL} ...`);
  const session = await startWalk({
    baseUrl: BASE_URL,
    password: E2E_USER_PASSWORD,
    headless: HEADLESS,
  });
  await walkItems(
    session,
    items.filter((item) => !approves(item)),
  );
  console.log("Keeping the asset and supplier registers ...");
  await keepRegisters(session);
  await walkItems(session, items.filter(approves));
  await session.page.goto("/durchgang/nis2");
  const { browser } = session;

  console.log(
    [
      "",
      `Done. ${COMPANY.name} has walked the whole walkthrough.`,
      `Sign in on ${BASE_URL} as ${IT_LEAD.email} or ${MANAGEMENT.email},`,
      "password: E2E_USER_PASSWORD in e2e/lib/env.ts (the same as the check account).",
    ].join("\n"),
  );
  if (HEADLESS) {
    await browser.close();
  } else {
    console.log("Close the browser window to end.");
    await new Promise((resolve) => browser.on("disconnected", resolve));
  }
}

const outcome = await run().then(
  () => 0,
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  },
);
process.exit(outcome);
