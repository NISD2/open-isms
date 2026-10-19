import { describe, expect, test } from "bun:test";
import {
  getNis2RequirementsForCategory,
  nis2Categories,
} from "@nisd2/grc-data-model/frameworks";
import { DURCHGANG_MESSAGES } from "@/i18n/durchgang";
import { FUNCTIONAL_GROUPS } from "@/lib/asset-inventory/catalog";
import { JOURNEY_ORDER } from "@/lib/compliance/journey-position";
import { CUSTOM_EDITOR_KEYS } from "@/lib/compliance/requirement-fields";
import { itemsFor, NIS2_WALK, resolveItem } from "./index";
import type { AnyItem, AnyScreen, ScreenKind } from "./types";

/**
 * What only the NIS 2 walk holds: its duty card on the BSIG, the journey order it follows, the
 * requirement page's editors and the asset catalogue. What every walk holds is ./walks.test.ts.
 */

const { de, en } = DURCHGANG_MESSAGES;
const { items: SCRIPT, notWalked: NOT_WALKED } = NIS2_WALK;

const FRAMEWORK = new Map(
  nis2Categories.flatMap((c) =>
    getNis2RequirementsForCategory(c.slug).map((r) => [
      r.code,
      { legalRef: r.legalRef, frameworkRef: r.frameworkRef },
    ]),
  ),
);

const screensOf = (item: AnyItem): readonly AnyScreen[] => item.screens;

/** The screen that stands in for a custom editor the requirement page shows. */
const EDITOR_SCREEN: Readonly<Record<string, ScreenKind>> = {
  "RSK:2.1": "adopt",
  "RSK:2.3": "rate",
};

/** Custom editors the flow deliberately leaves to the requirement page, each with the reason. */
const NO_EDITOR_SCREEN: Readonly<Record<string, string>> = {
  "RSK:2.4":
    "the treatment view records accepted residual risks, a CIR 2.1.2(j) duty the walk does not ask (see notAsked); 2.3 proposes each risk's treatment, and the view stays on the requirement page",
  "CRY:9.1":
    "the algorithm table, TLS minimum, rotation interval and post-quantum flag are CIR 2024/2690 Annex 9.2(b) and (c) and BSI TR-02102 detail; the walk writes the Kryptokonzept § 30 Abs. 2 Nr. 8 BSIG asks for, and the table stays on the requirement page",
  "ACC:10.1":
    "the access model, review cadence, deprovisioning hours, shared-account rule and authentication review cycle are CIR 2024/2690 Annex 11 and BSI detail; the walk writes the Konzept § 30 Abs. 2 Nr. 9 BSIG asks for, offers the review cadence as a clause, and the settings stay on the requirement page",
};

/** A NIS 2 item's law: the BSIG paragraph beside the directive's article. */
const lawOf = (item: AnyItem) => {
  if (item.law.act !== "nis2") throw new Error(`${item.code} cites no NIS 2 law`);
  return item.law;
};

describe("the NIS 2 script", () => {
  test("opens the duty card at the provision the requirement cites first", () => {
    for (const item of SCRIPT.filter((i) => !i.onlyFor)) {
      const cited = FRAMEWORK.get(item.code);
      const law = lawOf(item);
      expect(cited?.legalRef.startsWith(`§${law.bsig}(`)).toBe(true);
      expect(cited?.frameworkRef?.startsWith(`Art. ${law.article}(`)).toBe(true);
    }
  });

  test("opens an item for one entity type at the provision addressed to that type", () => {
    // The requirement cites first what binds every entity (12.4: § 30 Abs. 1 S. 3); the item
    // walks the part the statute addresses to that type only, which only the BSIG sets.
    for (const item of SCRIPT.filter((i) => i.onlyFor)) {
      const cited = FRAMEWORK.get(item.code);
      const law = lawOf(item);
      expect(cited?.legalRef).toContain(`§${law.bsig}(`);
      expect(law.article).toBeNull();
    }
  });

  test("walks the start of the journey without a gap, in journey order", () => {
    // Items are scripted from the front of the journey (spec §0.7), so the walk is always the
    // first N codes: a later item scripted before an earlier one would leave a hole in the path.
    // The only exceptions are the items left out, each listed with its reason, and the items
    // for one entity type, which every other entity leaves out with that reason.
    const forEveryone = SCRIPT.filter((i) => !i.onlyFor);
    const front = JOURNEY_ORDER.slice(
      0,
      forEveryone.length + Object.keys(NOT_WALKED).length,
    );
    expect(
      itemsFor(NIS2_WALK, {
        entityType: "important",
        criticalInstallation: "unsettled",
      }).map((i) => i.code),
    ).toEqual(front.filter((code) => !NOT_WALKED[code]));
    for (const code of Object.keys(NOT_WALKED)) expect(front).toContain(code);
  });

  test("gives every editor of the requirement page a screen", () => {
    for (const item of SCRIPT) {
      const kinds = new Set(screensOf(item).map((s) => s.kind));
      const editor = `${item.category}:${item.code}`;
      if (
        !(CUSTOM_EDITOR_KEYS as readonly string[]).includes(editor) ||
        NO_EDITOR_SCREEN[editor]
      ) {
        continue;
      }
      const needed = EDITOR_SCREEN[editor];
      expect({ editor, screen: needed && kinds.has(needed) }).toEqual({
        editor,
        screen: true,
      });
    }
  });

  test("offers the whole asset catalogue, each group on one screen", () => {
    for (const item of SCRIPT) {
      const groups = screensOf(item).flatMap((s) =>
        s.kind === "assets" ? s.groups : [],
      );
      if (groups.length > 0)
        expect([...groups].sort()).toEqual([...FUNCTIONAL_GROUPS].sort());
    }
  });
});

describe("the words of the NIS 2 walk", () => {
  test("names the authority once per language, filled in wherever the copy says {authority}", () => {
    const registration = SCRIPT.find((i) => i.code === "12.2");
    if (!registration) throw new Error("12.2 is scripted");
    const headline = (namespace: unknown) => {
      const resolved = resolveItem(namespace, registration);
      return resolved.ok ? resolved.value.headline : resolved.errors.join("; ");
    };
    expect(headline(de.durchgang)).toBe("Beim BSI registrieren");
    expect(headline(en.durchgang)).toBe("Register with your authority");

    const unknown = structuredClone(en.durchgang);
    unknown.items["12_2"].headline = "Register with {agency}";
    expect(headline(unknown)).toContain("unknown placeholder");
  });
});
