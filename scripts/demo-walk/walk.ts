/**
 * Walks the NIS 2 walkthrough in a real browser as the demo company's IT lead, typing the
 * persona's answers into each screen, and has management approve in its own window at 7.3. Items
 * are opened in walk order once the previous item's background saves have landed.
 *
 * Screens that only explain need nothing but "Weiter"; every other kind has one function below
 * that answers it from ./persona.ts.
 */
import {
  type Browser,
  chromium,
  type Locator,
  type Page,
  type Request,
} from "@playwright/test";
import { CATALOG } from "@/lib/asset-inventory/catalog";
import { FREQUENCY_TEXT, IMPACT_TEXT } from "@/lib/compliance/bsi-200-3";
import type { AnyItem } from "@/lib/durchgang";
import catalogMessages from "@/messages/assetInventory/de.json";
import {
  AGREEMENTS,
  ASSETS,
  BACKUPS,
  DEFAULT_RATING,
  FIELDS,
  IT_LEAD,
  KEEP_RUNNING,
  MANAGEMENT,
  MANAGEMENT_TRAININGS,
  NAMED,
  type Named,
  OWN_ENTRIES,
  POLICIES,
  RATINGS,
  REVIEW,
  SECOND_FACTOR,
  STAFF_TRAININGS,
  SUPPLIERS,
  type TrainingLine,
} from "./persona";

type Screen = AnyItem["screens"][number];
type Of<K extends Screen["kind"]> = Extract<Screen, { kind: K }>;

export interface WalkOptions {
  readonly baseUrl: string;
  readonly password: string;
  readonly headless: boolean;
}

/** The IT lead's signed-in page, and what management's window and the save tracking need. */
export interface Session {
  readonly page: Page;
  readonly browser: Browser;
  readonly options: WalkOptions;
  readonly quiet: () => Promise<void>;
}

const LOAD = { timeout: 30_000 } as const;

const CATALOG_LABEL: ReadonlyMap<string, string> = new Map(
  Object.entries(catalogMessages.assetInventory.catalog).map(([id, entry]) => [
    id,
    entry.label,
  ]),
);

const labelOf = (id: string): string => {
  const label = CATALOG_LABEL.get(id);
  if (!label) throw new Error(`catalogue entry ${id} has no German label`);
  return label;
};

/** Today in Berlin, as a date input takes it. */
const today = (): string =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());

const screenIndex = (page: Page): number =>
  Number(new URL(page.url()).searchParams.get("s") ?? 0);

const forward = (page: Page) =>
  page.getByRole("button", { name: /^(Weiter|Übernehmen)$/ });

/** Clicks a control in a long list after centring it, where the sticky header would cover it. */
export async function tap(target: Locator): Promise<void> {
  await target.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await target.click();
}

async function signedIn(browser: Browser, options: WalkOptions, email: string) {
  // Reduced motion: the walk then swaps screens without a View Transition, which would keep the
  // previous screen in the page for a moment after the address has changed.
  const context = await browser.newContext({
    baseURL: options.baseUrl,
    locale: "de-DE",
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("/auth/signin");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(options.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.includes("/auth/"), LOAD);
  return page;
}

async function fields(page: Page, screen: Of<"fields">) {
  for (const key of screen.fields) {
    const value = FIELDS[key];
    if (typeof value === "boolean") {
      await page.locator(`label[for="dg-${key}-${value ? "yes" : "no"}"]`).click();
    } else if (value !== undefined) {
      await page.locator(`#dg-${key}`).fill(value);
    }
  }
}

async function addTraining(page: Page, line: TrainingLine) {
  await page.locator("#dg-training-who").fill(line.who);
  await page.locator("#dg-training-what").fill(line.what);
  const provider = page.locator("#dg-training-provider");
  if (line.provider && (await provider.count()) > 0) await provider.fill(line.provider);
  await page.locator("#dg-training-date").fill(line.date);
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await page.getByText(line.who).first().waitFor(LOAD);
}

async function register(page: Page, screen: Of<"register">) {
  if (screen.module === "training_record") {
    await page.locator("#dg-training-who").waitFor(LOAD);
    const lines =
      screen.audience === "management" ? MANAGEMENT_TRAININGS : STAFF_TRAININGS;
    for (const line of lines) await addTraining(page, line);
  } else if (screen.module === "management_review") {
    await page.getByLabel("Datum").fill(today());
    await page.getByLabel("Wer teilgenommen hat").fill(REVIEW.attendees);
    await page.getByLabel("Entschieden").fill(REVIEW.decisions);
    await page.getByRole("button", { name: "Hinzufügen" }).click();
    await page.getByText(REVIEW.decisions).first().waitFor(LOAD);
  } else if (screen.module === "supplier") {
    const name = page.getByLabel("Lieferant", { exact: true });
    const does = page.getByLabel("Was er für Sie tut");
    for (const supplier of SUPPLIERS) {
      await name.fill(supplier.name);
      await does.fill(supplier.does);
      await does.press("Enter");
      await page.getByText(supplier.does).waitFor(LOAD);
    }
  }
}

/**
 * Ticks what the company has among the entries the screen offers, unticks the rest, and types in
 * its own entries.
 */
async function assets(page: Page, screen: Of<"assets">) {
  const groups: readonly string[] = screen.groups;
  const entries = CATALOG.filter((entry) => groups.includes(entry.group));
  const button = (id: string) =>
    page.getByRole("button", { name: labelOf(id), exact: true });
  const [first] = entries.filter((entry) => entry.appliesToSectors === undefined);
  if (first) await button(first.id).waitFor(LOAD);
  // A group can start folded (the sector's own entries do); a person opens it to see them.
  for (const fold of await page.locator('main button[aria-expanded="false"]').all()) {
    await tap(fold);
  }
  for (const entry of entries) {
    if ((await button(entry.id).count()) === 0) continue;
    const pressed = (await button(entry.id).getAttribute("aria-pressed")) === "true";
    if (pressed !== ASSETS.includes(entry.id)) await tap(button(entry.id));
  }
  for (const name of OWN_ENTRIES[screen.id] ?? []) {
    const own = page.getByPlaceholder(/^Eigene /).first();
    await own.fill(name);
    await own.press("Enter");
    await page.getByRole("listitem").filter({ hasText: name }).waitFor(LOAD);
  }
}

/**
 * Waits until a list stops growing: a list screen opens while the previous screen's save is still
 * landing, and its rows arrive with it.
 */
async function settled(page: Page, rows: Locator): Promise<void> {
  await rows.first().waitFor(LOAD);
  for (let last = -1, polls = 0; polls < 20; polls++) {
    const count = await rows.count();
    if (count === last) return;
    last = count;
    await page.waitForTimeout(500);
  }
}

/** The row whose name field shows `name` right now, by its asset id. */
const rowShowing = (page: Page, name: string): Promise<string | null> =>
  page
    .locator('[id^="what-"]')
    .evaluateAll(
      (inputs, shown) =>
        inputs
          .find((input) => input instanceof HTMLInputElement && input.value === shown)
          ?.id.slice("what-".length) ?? null,
      name,
    );

/** The asset ids of the rows on the screen. */
const rowIds = (page: Page): Promise<string[]> =>
  page
    .locator('[id^="what-"]')
    .evaluateAll((inputs) => inputs.map((input) => input.id.slice("what-".length)));

/**
 * Waits for the row "Noch eins dieser Art" adds. It is found as the new row rather than by its
 * name: the app numbers it after the names already saved, and renames on this screen are saved
 * only on "Weiter".
 */
async function rowAdded(page: Page, before: ReadonlySet<string>): Promise<string> {
  for (let polls = 0; polls < 30; polls++) {
    const added = (await rowIds(page)).find((id) => !before.has(id));
    if (added) return added;
    await page.waitForTimeout(500);
  }
  throw new Error("2.2: the added row did not appear");
}

/** Says what the thing in row `id` is for, adds its providers, and names it last. */
async function nameRow(page: Page, id: string, named: Named) {
  await page.locator(`#about-${id}`).fill(named.about);
  const provider = page.locator(`#provider-${id}`);
  for (const name of named.providers) {
    await provider.fill(name);
    await provider.press("Enter");
    await page.waitForFunction(
      (selector) => document.querySelector<HTMLInputElement>(selector)?.value === "",
      `#provider-${id}`,
    );
  }
  await page.locator(`#what-${id}`).fill(named.what);
}

/**
 * Names each listed thing, says what it is for and adds its providers. Each row is found by the
 * name it shows when it is its turn, and renamed last. A second thing of a kind is added from the
 * first one's row.
 */
async function specify(page: Page) {
  await settled(page, page.locator('[id^="what-"]'));
  for (const [key, things] of Object.entries(NAMED)) {
    const first = await rowShowing(page, CATALOG_LABEL.get(key) ?? key);
    const [one, ...more] = things;
    if (!first || !one) continue;
    await nameRow(page, first, one);
    for (const named of more) {
      const before = new Set(await rowIds(page));
      await tap(
        page
          .locator(`div:has(> #what-${first})`)
          .getByRole("button", { name: "Noch eins dieser Art" }),
      );
      await nameRow(page, await rowAdded(page, before), named);
    }
  }
}

async function rate(page: Page) {
  const notes = page.getByLabel(/^Notiz: /);
  await settled(page, notes);
  for (const note of await notes.all()) {
    const name = (await note.getAttribute("aria-label"))?.slice("Notiz: ".length) ?? "";
    const rating = RATINGS[name] ?? DEFAULT_RATING;
    const cell = `${IMPACT_TEXT.de[rating.impact].label}, ${FREQUENCY_TEXT.de[rating.frequency].label}:`;
    await page
      .getByRole("group", { name, exact: true })
      .getByRole("radio", { name: new RegExp(`^${cell}`) })
      .check();
    if (rating.note) await note.fill(rating.note);
  }
}

async function agreements(page: Page) {
  const none = page.getByRole("button", { name: "Nichts davon geregelt" });
  await settled(page, none);
  for (const button of await none.all()) await tap(button);
  for (const [supplier, agreed] of Object.entries(AGREEMENTS)) {
    const row = page
      .getByRole("listitem")
      .filter({ hasText: supplier })
      .filter({ has: none });
    if ((await row.count()) === 0) continue;
    if (agreed.security)
      await tap(row.getByRole("button", { name: /^Sicherheitsanforderungen/ }));
    if (agreed.incidents)
      await tap(
        row.getByRole("button", { name: "Meldung von Sicherheitsvorfällen an Sie" }),
      );
  }
}

async function logins(page: Page) {
  const factor = { name: "Mit zweitem Faktor" } as const;
  const withFactor = page.getByRole("button", factor);
  await settled(page, withFactor);
  for (const name of SECOND_FACTOR) {
    const row = page
      .getByRole("listitem")
      .filter({ hasText: name })
      .filter({ has: withFactor });
    if ((await row.count()) > 0) await tap(row.first().getByRole("button", factor));
  }
}

async function policy(page: Page, code: string) {
  const read = page.locator("#dg-policy-read");
  await read.waitFor(LOAD);
  const chosen = POLICIES[code];
  for (const clause of chosen?.clauses ?? []) {
    const button = page.getByRole("button", { name: clause, exact: true });
    if ((await button.getAttribute("aria-pressed")) !== "true") await tap(button);
  }
  if (chosen?.own) await page.locator("#dg-policy-own").fill(chosen.own);
  await read.check();
}

async function critical(page: Page) {
  const keep = page.getByRole("button", { name: "Muss weiterlaufen" });
  await keep.first().waitFor(LOAD);
  for (const [catalogId, how] of Object.entries(KEEP_RUNNING)) {
    const row = page
      .getByRole("listitem")
      .filter({ hasText: labelOf(catalogId) })
      .filter({ has: keep });
    if ((await row.count()) === 0) continue;
    await tap(row.getByRole("button", { name: "Muss weiterlaufen" }));
    await row.getByLabel("So geht es ohne IT weiter").fill(how);
  }
}

async function backups(page: Page) {
  for (const [system, backup] of Object.entries(BACKUPS)) {
    const row = page.getByRole("listitem").filter({ hasText: system });
    await row.first().waitFor(LOAD);
    await tap(row.getByRole("button", { name: backup.frequency, exact: true }));
    await row
      .getByLabel("Letzte geglückte Wiederherstellung daraus")
      .fill(backup.restored);
  }
}

/**
 * The IT lead is not management, so management approves on its own page, signed in with its own
 * account in a second window; the walk then shows the approval and moves on.
 */
async function approve({ page, browser, options, quiet }: Session) {
  await page.getByText("An die Geschäftsführung schicken").waitFor(LOAD);
  const management = await signedIn(browser, options, MANAGEMENT.email);
  await management.goto("/durchgang/nis2/freigabe");
  await management
    .getByRole("button", { name: /(Dokumente?|Punkte?) freigeben$/ })
    .click(LOAD);
  await management.getByText("Freigegeben. Jedes Dokument gilt ab heute.").waitFor(LOAD);
  await management.context().close();
  await quiet();
  await page.reload();
  await forward(page).waitFor(LOAD);
}

async function answer(session: Session, item: AnyItem, screen: Screen) {
  const { page } = session;
  switch (screen.kind) {
    case "fields":
      return fields(page, screen);
    case "prepare":
      return screen.confirm ? page.locator("#dg-ready").check() : undefined;
    case "register":
      return register(page, screen);
    case "assets":
      return assets(page, screen);
    case "specify":
      return specify(page);
    case "rate":
      return rate(page);
    case "agreements":
      return agreements(page);
    case "logins":
      return logins(page);
    case "crypto":
      return page.locator("#dg-crypto-applies").check();
    case "policy":
      return policy(page, item.code);
    case "critical":
      return critical(page);
    case "backups":
      return backups(page);
    case "approve":
      return approve(session);
    default:
      return undefined;
  }
}

/** Answers each screen of the open item and presses "Weiter" until its done screen. */
async function walkItem(session: Session, item: AnyItem) {
  const { page } = session;
  for (let attempt = 0; attempt < item.screens.length * 2; attempt++) {
    const index = screenIndex(page);
    const screen = item.screens[index];
    if (!screen) throw new Error(`${item.code}: no screen ${index}`);
    if (screen.kind === "done") return;
    await forward(page).waitFor(LOAD);
    await answer(session, item, screen);
    // A screen counts a new register line once its list query has refetched.
    await page
      .waitForFunction(
        (button) => button instanceof HTMLButtonElement && !button.disabled,
        await forward(page).elementHandle(),
        { timeout: 10_000 },
      )
      .catch(() => undefined);
    if (await forward(page).isDisabled())
      throw new Error(
        `${item.code} ${screen.id}: "Weiter" stays disabled after answering`,
      );
    await forward(page).click();
    // Adopting turns the button into "Weiter" on the same screen; the next pass presses it.
    await page
      .waitForFunction(
        (from) => Number(new URLSearchParams(location.search).get("s") ?? 0) !== from,
        index,
        { timeout: 15_000 },
      )
      .catch(() => undefined);
  }
  throw new Error(`${item.code} did not reach its done screen`);
}

/**
 * Resolves once no request to the API is open. The walk saves each screen in the background, and
 * leaving the page before a save lands would cancel it.
 */
function apiQuiet(page: Page): () => Promise<void> {
  const open = new Set<Request>();
  const isApi = (request: Request) => new URL(request.url()).pathname.startsWith("/api/");
  page.on("request", (request) => {
    if (isApi(request)) open.add(request);
  });
  page.on("requestfinished", (request) => open.delete(request));
  page.on("requestfailed", (request) => open.delete(request));
  return async () => {
    while (open.size > 0) await page.waitForTimeout(100);
  };
}

/** Opens the browser and signs the IT lead in. */
export async function startWalk(options: WalkOptions): Promise<Session> {
  const browser = await chromium.launch({
    headless: options.headless,
    slowMo: options.headless ? 0 : 60,
  });
  const page = await signedIn(browser, options, IT_LEAD.email);
  return { page, browser, options, quiet: apiQuiet(page) };
}

/** Walks these items in order, each opened once the previous one's saves have landed. */
export async function walkItems(session: Session, items: readonly AnyItem[]) {
  for (const item of items) {
    console.log(`  ${item.code}`);
    await session.page.goto(`/durchgang/nis2/${item.code}`);
    await walkItem(session, item);
    await session.quiet();
  }
}
