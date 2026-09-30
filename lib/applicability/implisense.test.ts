import { describe, expect, test } from "bun:test";
import {
  implisenseCompanySchema,
  implisenseIdSchema,
  implisenseSearchSchema,
  readVendorJson,
} from "./implisense";

const COMPANY = {
  id: "DEPIYX8Y4M82",
  name: "Beispiel Stadtwerke GmbH",
  street: "Musterstraße 1",
  zip: "12345",
  city: "Musterstadt",
  active: true,
  legalForm: "GmbH",
  purpose: null,
  capital: null,
  foundingDate: null,
  size: { code: "MEDIUM", name: "Medium" },
  revenue: null,
  industries: {
    wz2008: [{ type: "primary", code: "35.11", title: "Elektrizitätserzeugung" }],
  },
  externalIds: null,
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("Implisense company id", () => {
  test("accepts the vendor's format", () => {
    expect(implisenseIdSchema.safeParse("DEPIYX8Y4M82").success).toBe(true);
    expect(implisenseIdSchema.safeParse("DE4J7KGUR646").success).toBe(true);
  });

  test("rejects anything that would change the URL path", () => {
    for (const id of [
      "..",
      ".",
      "/",
      "DE/../keys",
      "DEPIYX8Y4M8.",
      "DEPIYX8Y4M82/",
      "%2e%2e",
    ]) {
      expect(implisenseIdSchema.safeParse(id).success).toBe(false);
    }
  });

  test("rejects the wrong length or lower case", () => {
    for (const id of ["", "DEPIYX8Y4M8", "DEPIYX8Y4M821", "depiyx8y4m82"]) {
      expect(implisenseIdSchema.safeParse(id).success).toBe(false);
    }
  });
});

describe("reading a vendor answer", () => {
  test("a matching answer comes back parsed", async () => {
    expect(await readVendorJson(json(COMPANY), implisenseCompanySchema)).toMatchObject({
      id: COMPANY.id,
      name: COMPANY.name,
    });
  });

  test("a 200 that is not JSON is no result", async () => {
    const html = new Response("<html>Rate limit</html>", { status: 200 });
    expect(await readVendorJson(html, implisenseSearchSchema)).toBeNull();
  });

  test("a 200 of another shape is no result", async () => {
    expect(
      await readVendorJson(json({ message: "quota" }), implisenseSearchSchema),
    ).toBeNull();
    expect(
      await readVendorJson(json({ ...COMPANY, id: ".." }), implisenseCompanySchema),
    ).toBeNull();
  });

  test("a search listing a malformed id is no result", async () => {
    const listing = { companies: [{ ...COMPANY, id: "../companies" }] };
    expect(await readVendorJson(json(listing), implisenseSearchSchema)).toBeNull();
  });

  test("a failed status is no result", async () => {
    expect(await readVendorJson(json(COMPANY, 500), implisenseCompanySchema)).toBeNull();
  });
});
