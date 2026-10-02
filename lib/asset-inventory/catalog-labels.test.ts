import { expect, test } from "bun:test";
import {
  catalogIdByName,
  catalogIdOf,
  noSignIn,
  onRegister,
  ownDescription,
} from "./catalog-labels";

const listed = (name: string, description: string | null = null, catalogId = null) => ({
  catalogId,
  name,
  description,
});

test("knows a catalogue name in either language, and nothing else", () => {
  expect(catalogIdByName("Internes Netzwerk (LAN, Netzsegmente)")).toBe("net-lan");
  expect(catalogIdByName(" internal network (lan, network segments) ")).toBe("net-lan");
  expect(catalogIdByName("CRM for the sales team, hosted in the EU")).toBeNull();
  expect(catalogIdByName(null)).toBeNull();
});

test("reads the catalogue item off the column first, then the name, then the description", () => {
  expect(
    catalogIdOf({
      catalogId: "sales-crm",
      name: "Laptops and desktops",
      description: null,
    }),
  ).toBe("sales-crm");
  expect(catalogIdOf(listed("Laptops and desktops"))).toBe("ep-laptops");
  expect(
    catalogIdOf(listed("Telekom Glasfaser", "Internes Netzwerk (LAN, Netzsegmente)")),
  ).toBe("net-lan");
  expect(catalogIdOf(listed("Our own portal", "Where customers log in"))).toBeNull();
});

test("leaves out a line nobody signs in to, by its name in either language", () => {
  expect(noSignIn(listed("Internal network (LAN, network segments)"))).toBe(true);
  expect(noSignIn(listed("Internes Netzwerk (LAN, Netzsegmente)"))).toBe(true);
});

test("still finds the line once 2.2 renamed it to the product", () => {
  expect(
    noSignIn({ catalogId: "net-lan", name: "Telekom Glasfaser", description: null }),
  ).toBe(true);
  expect(
    noSignIn(listed("Telekom Glasfaser", "Internes Netzwerk (LAN, Netzsegmente)")),
  ).toBe(true);
});

test("keeps remote access, network equipment and anything not in the catalogue", () => {
  expect(noSignIn(listed("VPN oder Zero-Trust-Fernzugriff"))).toBe(false);
  expect(noSignIn(listed("Network equipment (firewall, switches, WiFi)"))).toBe(false);
  expect(noSignIn(listed("Our own portal"))).toBe(false);
});

test("counts a renamed item as listed, and only the company's own things as others", () => {
  expect(
    onRegister([
      { catalogId: "sales-crm", name: "Salesforce", description: null },
      listed("Laptops and desktops"),
      listed("Our own portal"),
    ]),
  ).toEqual({ listed: ["sales-crm", "ep-laptops"], others: ["Our own portal"] });
});

test("a catalogue name left in the description is not the company's own description", () => {
  expect(
    ownDescription({ description: "CRM (Salesforce, HubSpot, Pipedrive)" }),
  ).toBeNull();
  expect(ownDescription({ description: "  Sales contacts and quotes  " })).toBe(
    "Sales contacts and quotes",
  );
  expect(ownDescription({ description: " " })).toBeNull();
});
