/**
 * Deleting a training record or a certification left its file in the bucket.
 * The file now goes with the row, but only when it is the company's own and
 * no other row still points at it, and never at the cost of failing a delete
 * the person already got.
 */
import { describe, expect, spyOn, test } from "bun:test";
import { removeReleasedObject } from "./released-object";

const PREFIX = "companies/11111111-1111-4111-8111-111111111111/training-certs/";
const KEY = `${PREFIX}b2-Zertifikat_Anna_Muster.pdf`;

function run(overrides: Partial<Parameters<typeof removeReleasedObject>[0]> = {}) {
  const removed: string[] = [];
  const outcome = removeReleasedObject({
    key: KEY,
    prefix: PREFIX,
    stillReferenced: async () => false,
    remove: async (key) => {
      removed.push(key);
    },
    record: "training_record r-1",
    ...overrides,
  });
  return { outcome, removed };
}

describe("removeReleasedObject", () => {
  test("removes the file of a deleted row", async () => {
    const { outcome, removed } = run();
    expect(await outcome).toBe("removed");
    expect(removed).toEqual([KEY]);
  });

  test("keeps a file another row still points at", async () => {
    const { outcome, removed } = run({ stillReferenced: async () => true });
    expect(await outcome).toBe("kept");
    expect(removed).toEqual([]);
  });

  // A row written before keys were checked on write may name any object.
  test("keeps a key outside the company's folder", async () => {
    const { outcome, removed } = run({ key: "evidence/other-company/x.pdf" });
    expect(await outcome).toBe("kept");
    expect(removed).toEqual([]);
  });

  test("does nothing for a row without a file", async () => {
    expect(await run({ key: null }).outcome).toBe("kept");
  });

  test("logs a failed removal without the key and does not throw", async () => {
    const errors = spyOn(console, "error").mockImplementation(() => {});
    try {
      const failure = Object.assign(new Error(`Access Denied for ${KEY}`), {
        name: "AccessDenied",
      });
      const { outcome } = run({
        remove: async () => {
          throw failure;
        },
      });
      expect(await outcome).toBe("failed");
      const logged = errors.mock.calls.flat().join(" ");
      expect(logged).toContain("training_record r-1");
      expect(logged).toContain("AccessDenied");
      expect(logged).not.toContain("Anna_Muster");
    } finally {
      errors.mockRestore();
    }
  });
});
