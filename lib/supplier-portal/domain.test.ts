import { describe, expect, test } from "bun:test";
import { securityProfileUpdateSchema } from "@/schema/validators";
import { normalizeDomain } from "./domain";

describe("normalizeDomain", () => {
  test("reduces a pasted address to its bare host name", () => {
    expect(normalizeDomain("https://www.Foo.Example.de/contact?x=1")).toBe(
      "foo.example.de",
    );
    expect(normalizeDomain("user@example.de")).toBe("example.de");
    expect(normalizeDomain("  example.de  ")).toBe("example.de");
  });

  test("returns null when there is no domain in it", () => {
    expect(normalizeDomain("")).toBeNull();
    expect(normalizeDomain("not a domain")).toBeNull();
    expect(normalizeDomain("localhost")).toBeNull();
  });
});

describe("the save schema's domain", () => {
  const domainOf = (value: unknown) =>
    securityProfileUpdateSchema.safeParse({ primaryDomain: value });

  test("stores the bare host name of what was pasted", () => {
    const parsed = domainOf("https://www.Example-Supplier.eu/de/preise");
    expect(parsed.success && parsed.data.primaryDomain).toBe("example-supplier.eu");
  });

  test("clears with null and rejects what holds no domain", () => {
    const cleared = domainOf(null);
    expect(cleared.success && cleared.data.primaryDomain).toBeNull();
    expect(domainOf("not a domain").success).toBe(false);
  });
});
