import { describe, expect, test } from "bun:test";
import { closeEnvShape } from "./config-schema";
import { type CloseFacts, closeFieldValues } from "./fields";
import { fingerprint } from "./fingerprint";

const facts: CloseFacts = {
  // 23:30 UTC on 28.09 is already 29.09 in Berlin, which is the day Close should show.
  signedUpAt: new Date("2026-09-28T23:30:00Z"),
  lastLoginAt: null,
  loginCount: 7,
  grandfathered: true,
  mayEmail: false,
  freeMail: true,
  ceoCourse: { done: 3, total: 12, completedAt: null },
  company: {
    name: "Muster GmbH",
    sector: "waste",
    employeeCount: 80,
    country: "DE",
    actsAsSupplier: true,
  },
  access: "grandfathered",
  path: { done: 10, total: 49 },
};

describe("closeFieldValues", () => {
  test("writes only the configured fields, keyed by Close id, at their level", () => {
    const values = closeFieldValues(facts, { grandfathered: "cf_gf", company: "cf_co" });
    expect(values).toEqual({
      contact: { "custom.cf_gf": "Yes" },
      lead: { "custom.cf_co": "Muster GmbH" },
    });
  });

  test("turns every fact into a value Close accepts", () => {
    const ids = {
      signedUp: "a",
      lastLogin: "b",
      logins: "c",
      mayEmail: "d",
      freeMail: "e",
      ceoCourseProgress: "f",
      ceoCourseCompleted: "g",
      access: "k",
      company: "h",
      employees: "i",
      supplier: "j",
      pathProgress: "l",
    };
    expect(closeFieldValues(facts, ids)).toEqual({
      contact: {
        "custom.a": "2026-09-29",
        "custom.b": null,
        "custom.c": 7,
        "custom.d": "No",
        "custom.e": "Yes",
        "custom.f": 25,
        "custom.g": null,
        "custom.k": "grandfathered",
      },
      lead: {
        "custom.h": "Muster GmbH",
        "custom.i": 80,
        "custom.j": "Yes",
        "custom.l": 20,
      },
    });
  });

  test("a person without a company writes nothing to the lead", () => {
    const values = closeFieldValues(
      { ...facts, company: null, access: null, path: null },
      { company: "h", supplier: "j", pathProgress: "l", access: "k" },
    );
    expect(values).toEqual({ contact: { "custom.k": null }, lead: {} });
  });
});

describe("fingerprint", () => {
  test("changes when a value changes or a field is added, and only then", () => {
    const base = fingerprint(closeFieldValues(facts, { grandfathered: "cf_gf" }));
    expect(fingerprint(closeFieldValues(facts, { grandfathered: "cf_gf" }))).toBe(base);
    expect(
      fingerprint(
        closeFieldValues({ ...facts, grandfathered: false }, { grandfathered: "cf_gf" }),
      ),
    ).not.toBe(base);
    expect(
      fingerprint(closeFieldValues(facts, { grandfathered: "cf_gf", company: "cf_co" })),
    ).not.toBe(base);
  });
});

describe("CLOSE_FIELD_IDS", () => {
  const parse = (raw: string | undefined) => closeEnvShape.CLOSE_FIELD_IDS.parse(raw);

  test("keeps known keys with a non-empty id, trimmed", () => {
    expect(
      parse(' {"grandfathered":" cf_gf ","leadSource":"cf_s","logins":""} '),
    ).toEqual({
      grandfathered: "cf_gf",
      leadSource: "cf_s",
    });
  });

  test("drops unknown keys and anything that is not a JSON object, instead of failing", () => {
    expect(parse('{"nope":"cf_x"}')).toEqual({});
    expect(parse("not json")).toEqual({});
    expect(parse('["cf_x"]')).toEqual({});
    expect(parse(undefined)).toEqual({});
  });
});
