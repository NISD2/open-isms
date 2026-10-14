/**
 * What the MCP tools read off the walk. Pinned here: every item's input is derived (fields from
 * the category schema, rows from the register's create input), no item shows two registers, and
 * an assistant's dates arrive as text and still reach the schema as dates.
 */
import { describe, expect, test } from "bun:test";
import { WALK } from "@/lib/durchgang";
import { trainingCreateSchema } from "@/schema/validators";
import {
  answersProblem,
  closedFor,
  fieldKeysOf,
  fieldsSchemaOf,
  jsonSchemaOf,
  registerOfItem,
  rowsProblem,
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

  test("a register date only in ISO form: 01.03.2026 would be read as 3 January", () => {
    const row = textDates(trainingCreateSchema);
    const base = {
      trainingType: "awareness",
      title: "Phishing",
      participantName: "Team",
    };
    expect(row.safeParse({ ...base, completedAt: "01.03.2026" }).success).toBe(false);
    expect(row.safeParse({ ...base, completedAt: "2026-03-01T09:00:00Z" }).success).toBe(
      true,
    );
  });
});

describe("what an assistant may change", () => {
  const since = new Date("2026-10-01T00:00:00Z");
  const unsigned = { status: "in_progress", signedOffAt: null };

  test("only an item still open or waiting, and never one carrying a signature", () => {
    expect(closedFor({ kind: "open" }, unsigned)).toBeNull();
    expect(closedFor({ kind: "waiting", reason: "letter", since }, unsigned)).toBeNull();
    expect(closedFor({ kind: "filled", since }, unsigned)).toBe("filled");
    expect(closedFor({ kind: "declined", since }, unsigned)).toBe("declined");
    expect(closedFor({ kind: "signed" }, null)).toBe("signed");
    expect(closedFor({ kind: "not_applicable" }, null)).toBe("signed");
  });

  test("an item whose review came due still carries its signature, though the walk shows it filled", () => {
    const dueForReview = { status: "needs_review", signedOffAt: since };
    expect(closedFor({ kind: "filled", since }, dueForReview)).toBe("signed");
    expect(closedFor({ kind: "waiting", reason: null, since }, dueForReview)).toBe(
      "signed",
    );
  });

  test("an item a reviewer rejected is open for the rework the rejection asks for", () => {
    const rejected = { status: "rejected", signedOffAt: since };
    expect(closedFor({ kind: "open" }, rejected)).toBeNull();
  });

  test("answers: only the item's own fields, never empty, of the field's type", () => {
    const item = WALK.find((i) => i.code === "11.2");
    if (!item) throw new Error("11.2 is not in the walk");
    const [field] = fieldKeysOf(item);
    if (!field) throw new Error("11.2 asks no field");
    expect(answersProblem(item, { bogus: "x" })).toContain("asks no field bogus");
    expect(answersProblem(item, { [field]: "" })).toContain("cannot be empty");
    expect(answersProblem(item, { [field]: null })).toContain("cannot be empty");
    expect(answersProblem(item, { [field]: "   " })).toContain("cannot be empty");
    expect(answersProblem(item, { [field]: 12 })).not.toBeNull();
    expect(answersProblem(item, { [field]: "Signal, Threema" })).toBeNull();
  });

  test("a date answer only as YYYY-MM-DD, which the app's date input reads", () => {
    const item = WALK.find((i) => i.code === "12.2");
    if (!item) throw new Error("12.2 is not in the walk");
    expect(answersProblem(item, { bsiRegistrationDate: "2026-03-01" })).toBeNull();
    for (const value of ["01.03.2026", "March 1, 2026", 1767225600000]) {
      expect(answersProblem(item, { bsiRegistrationDate: value })).toContain(
        "YYYY-MM-DD",
      );
    }
  });

  test("rows are checked before anything is written", () => {
    const item = WALK.find((i) => i.code === "5.1");
    const register = item && registerOfItem(item);
    if (!register) throw new Error("5.1 has no register");
    expect(rowsProblem(register, [{ name: "Hoster" }])).toBeNull();
    expect(rowsProblem(register, [{ name: "Hoster" }, { name: 12 }])).toContain("Row 1");
  });
});
