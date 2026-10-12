/**
 * What the MCP tools read off the walk. Pinned here: every item's input is derived (fields from
 * the category schema, rows from the register's create input), no item shows two registers, and
 * an assistant's dates arrive as text and still reach the schema as dates.
 */
import { describe, expect, test } from "bun:test";
import { WALK } from "@/lib/durchgang";
import { trainingCreateSchema } from "@/schema/validators";
import {
  fieldKeysOf,
  fieldsSchemaOf,
  jsonSchemaOf,
  registerOfItem,
  screensFilledBy,
  textDates,
} from "./walk";

type JsonSchema = {
  readonly properties?: Record<string, unknown>;
  readonly required?: unknown;
};

describe("the walk as an assistant sees it", () => {
  test("no item shows more than one register", () => {
    for (const item of WALK) {
      expect(
        item.screens.filter((s) => s.kind === "register").length,
      ).toBeLessThanOrEqual(1);
    }
  });

  test("each item's fields come from its category schema, all optional", () => {
    for (const item of WALK) {
      const keys = fieldKeysOf(item);
      const schema = fieldsSchemaOf(item);
      if (keys.length === 0) {
        expect(schema).toBeNull();
        continue;
      }
      if (!schema) throw new Error(`${item.code}: no schema for ${keys.join(", ")}`);
      const json = jsonSchemaOf(schema) as JsonSchema;
      expect(Object.keys(json.properties ?? {}).sort()).toEqual([...keys].sort());
      expect(json.required).toBeUndefined();
    }
  });

  test("each register's rows have a schema, and none takes a file key", () => {
    const registers = WALK.flatMap((item) => {
      const register = registerOfItem(item);
      return register ? [register] : [];
    });
    expect(registers.map((r) => r.name).sort()).toEqual([
      "management_review",
      "supplier",
      "training_record:management",
      "training_record:staff",
    ]);
    for (const register of registers) {
      const properties = Object.keys(
        (jsonSchemaOf(register.row) as JsonSchema).properties ?? {},
      );
      expect(properties.length).toBeGreaterThan(0);
      expect(properties.filter((p) => p.endsWith("FileKey"))).toEqual([]);
    }
  });

  test("a training row is filed by its screen's audience, never by the assistant", () => {
    const training = WALK.flatMap((item) => {
      const register = registerOfItem(item);
      return register?.name.startsWith("training_record") ? [register] : [];
    });
    for (const register of training) {
      const properties = Object.keys(
        (jsonSchemaOf(register.row) as JsonSchema).properties ?? {},
      );
      expect(properties).not.toContain("trainingType");
      expect(properties).not.toContain("isManagement");
    }
  });

  test("screens that take input only in the app are named per item", () => {
    const assets = WALK.find((item) => item.code === "2.2");
    if (!assets) throw new Error("2.2 is not in the walk");
    expect(screensFilledBy(assets, "app")).toEqual(["assets", "specify"]);
    expect(screensFilledBy(assets, "assistant")).toEqual([]);
  });

  test("dates sent as text reach the schema as dates; text that is no date fails", () => {
    const row = textDates(trainingCreateSchema);
    const base = {
      trainingType: "awareness",
      title: "Phishing",
      participantName: "Team",
    };
    expect(row.parse({ ...base, completedAt: "2026-03-01" }).completedAt).toBeInstanceOf(
      Date,
    );
    expect(row.safeParse({ ...base, completedAt: "last spring" }).success).toBe(false);
  });
});
