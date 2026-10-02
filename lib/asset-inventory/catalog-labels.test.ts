import { expect, test } from "bun:test";
import { noSignIn } from "./catalog-labels";

test("leaves out a line nobody signs in to, by its name in either language", () => {
  expect(
    noSignIn({ name: "Internal network (LAN, network segments)", description: null }),
  ).toBe(true);
  expect(
    noSignIn({ name: "Internes Netzwerk (LAN, Netzsegmente)", description: null }),
  ).toBe(true);
});

test("finds the line by the catalogue name 2.2 kept in the description after a rename", () => {
  expect(
    noSignIn({
      name: "Telekom Glasfaser",
      description: "Internes Netzwerk (LAN, Netzsegmente)",
    }),
  ).toBe(true);
});

test("keeps remote access, network equipment and anything not in the catalogue", () => {
  expect(noSignIn({ name: "VPN oder Zero-Trust-Fernzugriff", description: null })).toBe(
    false,
  );
  expect(
    noSignIn({ name: "Network equipment (firewall, switches, WiFi)", description: null }),
  ).toBe(false);
  expect(noSignIn({ name: "Our own portal", description: null })).toBe(false);
});
