import { describe, expect, test } from "bun:test";
import { inboxOf } from "./inbox";

describe("inboxOf", () => {
  test("drops a plus tag on any domain", () => {
    expect(inboxOf("isb+1@kunde.test")).toBe("isb@kunde.test");
    expect(inboxOf("ISB+Lieferant+2@Kunde.test")).toBe("isb@kunde.test");
  });

  test("folds Gmail's dots and googlemail.com into one inbox", () => {
    const one = inboxOf("jane.doe@gmail.com");
    expect(inboxOf("j.a.n.e.d.o.e+x@googlemail.com")).toBe(one);
    expect(inboxOf("JaneDoe@GMAIL.com")).toBe(one);
    expect(one).toBe("janedoe@gmail.com");
  });

  test("keeps dots elsewhere, where they can name different people", () => {
    expect(inboxOf("jane.doe@kunde.test")).not.toBe(inboxOf("janedoe@kunde.test"));
  });
});
