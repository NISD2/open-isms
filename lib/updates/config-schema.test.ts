import { describe, expect, test } from "bun:test";
import { getUpdateMode, normalizeUpdateMode, updateEnvSchema } from "./config-schema";

const parse = (env: Record<string, string | undefined>) => updateEnvSchema.parse(env);

describe("UPDATE_MODE configuration schema", () => {
  test("defaults to 'off' when unset or empty", () => {
    expect(normalizeUpdateMode(undefined)).toBe("off");
    expect(normalizeUpdateMode("")).toBe("off");
    expect(normalizeUpdateMode("   ")).toBe("off");
    expect(parse({})).toMatchObject({
      UPDATE_MODE: "off",
    });
  });

  test("accepts 'off' explicitly", () => {
    expect(normalizeUpdateMode("off")).toBe("off");
    expect(normalizeUpdateMode("  OFF  ")).toBe("off");
    expect(parse({ UPDATE_MODE: "off" })).toMatchObject({
      UPDATE_MODE: "off",
    });
  });

  test("accepts 'notify'", () => {
    expect(normalizeUpdateMode("notify")).toBe("notify");
    expect(normalizeUpdateMode("  NOTIFY  ")).toBe("notify");
    expect(parse({ UPDATE_MODE: "notify" })).toMatchObject({
      UPDATE_MODE: "notify",
    });
  });

  test("rejects 'auto' and safely falls back to 'off' with a warning", () => {
    expect(normalizeUpdateMode("auto")).toBe("off");
    expect(parse({ UPDATE_MODE: "auto" })).toMatchObject({
      UPDATE_MODE: "off",
    });
  });

  test("handles unknown values safely without throwing", () => {
    expect(normalizeUpdateMode("invalid_mode")).toBe("off");
    expect(normalizeUpdateMode("yes")).toBe("off");
    expect(normalizeUpdateMode(123)).toBe("off");
    expect(() => parse({ UPDATE_MODE: "invalid_mode" })).not.toThrow();
    expect(parse({ UPDATE_MODE: "invalid_mode" })).toMatchObject({
      UPDATE_MODE: "off",
    });
  });

  test("reads UPDATE_API_TOKEN and UPDATER_URL", () => {
    const res = parse({
      UPDATE_API_TOKEN: "  secret-token  ",
      UPDATER_URL: "http://custom-updater:9000/v1/update",
    });
    expect(res.UPDATE_API_TOKEN).toBe("secret-token");
    expect(res.UPDATER_URL).toBe("http://custom-updater:9000/v1/update");
  });

  test("UPDATER_URL defaults to http://updater:8080/v1/update", () => {
    expect(parse({})).toMatchObject({
      UPDATER_URL: "http://updater:8080/v1/update",
    });
  });

  test("getUpdateMode reflects process.env.UPDATE_MODE", () => {
    const prev = process.env.UPDATE_MODE;
    try {
      process.env.UPDATE_MODE = "notify";
      expect(getUpdateMode()).toBe("notify");
      process.env.UPDATE_MODE = "off";
      expect(getUpdateMode()).toBe("off");
      delete process.env.UPDATE_MODE;
      expect(getUpdateMode()).toBe("off");
    } finally {
      if (prev !== undefined) {
        process.env.UPDATE_MODE = prev;
      } else {
        delete process.env.UPDATE_MODE;
      }
    }
  });
});
