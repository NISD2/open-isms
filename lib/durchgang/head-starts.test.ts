/**
 * NIS 2 work gives some GDPR items a head start, shown on the item's first screen with a line on
 * what the GDPR still asks. Pinned here: the NIS 2 items come in walk order, and an item with a
 * head start has that line, so a new pair in the data model cannot show an unexplained list.
 */
import { describe, expect, test } from "bun:test";
import { itemKey } from "./copy";
import { GDPR_WALK } from "./gdpr";
import { headStartsOf } from "./head-starts";

const englishCopy = async (code: string) => {
  const key = itemKey(code);
  const file = await import(`../../messages/durchgang/item-${key}/en.json`);
  return file.default.durchgang.items[key] as { readonly fromNis2?: string };
};

describe("head starts from the NIS 2 walk", () => {
  test("lists the overlapping NIS 2 items in the NIS 2 walk's order", () => {
    expect(headStartsOf("G-DPA.1")).toEqual(["5.1", "5.2"]);
    expect(headStartsOf("G-ROP.1")).toEqual(["2.1", "2.2", "2.3"]);
  });

  test("an item NIS 2 does not touch has none", () => {
    expect(headStartsOf("G-DPO.1")).toEqual([]);
    expect(headStartsOf("G-DSR.1")).toEqual([]);
  });

  test("every GDPR item with a head start says in English what the GDPR still asks", async () => {
    const missing = (
      await Promise.all(
        GDPR_WALK.items.map(async (item) =>
          headStartsOf(item.code).length > 0 && !(await englishCopy(item.code)).fromNis2
            ? [item.code]
            : [],
        ),
      )
    ).flat();
    expect(missing).toEqual([]);
  });
});
