/**
 * read_records as an assistant calls it: it reads only through records.readPart on the key's
 * caller, never the database, and every answer it does not read for is said in the assistant's
 * language before or instead of that call.
 */
import { describe, expect, mock, test } from "bun:test";
import { TRPCError } from "@trpc/server";

// The tool reaches lib/db through its gates, which read a validated env as they load; CI has none.
// The same values as every other test that mocks it, since a mock holds for the whole run.
mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
  },
  mailSupportEmail: () => "support@example.test",
}));
const { readRecords, ReadRecordsInput } = await import("./records");
type KeyHolder = import("./context").KeyHolder;

type Read = { readonly part: string; readonly page: number };

/** A key holder whose only procedure is records.readPart, answering with `answer`. */
function holderWith(
  answer: () => Promise<unknown>,
  { mayWalk = true, mayExport = true, readRecords = true } = {},
) {
  const reads: Read[] = [];
  const holder = {
    caller: {
      records: {
        readPart: async (input: Read) => {
          reads.push(input);
          return answer();
        },
      },
    },
    userId: "user-1",
    companyId: "company-1",
    role: "admin",
    mayWalk,
    mayExport,
    readRecords,
    agent: "mcp: Claude",
    ip: null,
  } as unknown as KeyHolder;
  return { holder, reads };
}

const input = (raw: Record<string, unknown>) => ReadRecordsInput.parse(raw);
const PAGE = async () => ({ kind: "rows", rows: [{ title: "Plugin" }], more: false });

describe("read_records", () => {
  test("reads through records.readPart, the part and page it was asked for", async () => {
    const { holder, reads } = holderWith(PAGE);
    const outcome = await readRecords(
      holder,
      input({ part: "vulnerabilities", page: 2 }),
    );
    expect(reads).toEqual([{ part: "vulnerabilities", page: 2 }]);
    expect(outcome).toEqual({
      ok: true,
      data: {
        part: "vulnerabilities",
        page: 2,
        rows: [{ title: "Plugin" }],
        more: false,
        next: null,
      },
    });
  });

  test("an account without the walkthrough's plan: told so, nothing read", async () => {
    const { holder, reads } = holderWith(PAGE, { mayWalk: false });
    const outcome = await readRecords(holder, input({ part: "assets", language: "en" }));
    expect(outcome.ok).toBe(false);
    expect(outcome.ok ? "" : outcome.message).toContain("not unlocked");
    expect(reads).toEqual([]);
  });

  test("the admin has not let assistants read the records: told where to turn it on, nothing read", async () => {
    for (const mayExport of [true, false]) {
      const { holder, reads } = holderWith(PAGE, { readRecords: false, mayExport });
      const outcome = await readRecords(
        holder,
        input({ part: "assets", language: "de" }),
      );
      expect(outcome.ok).toBe(false);
      const message = outcome.ok ? "" : outcome.message;
      expect(message).toContain("Admin");
      // German is the default locale, so its Settings page carries no locale prefix.
      expect(message).toMatch(/ https:\/\/\S+\/settings$/);
      expect(reads).toEqual([]);
    }
  });

  test("someone who may not export: told who may, in the assistant's language, nothing read", async () => {
    const { holder, reads } = holderWith(PAGE, { mayExport: false });
    const outcome = await readRecords(holder, input({ part: "assets", language: "de" }));
    expect(outcome.ok ? "" : outcome.message).toContain("Geschäftsleitung");
    expect(reads).toEqual([]);
  });

  test("the money back's hold: the export page, where the person confirms", async () => {
    const { holder } = holderWith(async () => {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "money back" });
    });
    const outcome = await readRecords(holder, input({ part: "assets", language: "en" }));
    expect(outcome.ok).toBe(false);
    const message = outcome.ok ? "" : outcome.message;
    // The app's own address (NEXT_PUBLIC_APP_URL), then the export page in the assistant's language.
    expect(message).toMatch(/https:\/\/\S+\/en\/export$/);
    expect(message).toContain("B7");
  });

  test("any other refusal of the procedure is not turned into an answer", async () => {
    const { holder } = holderWith(async () => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not available to an assistant.",
      });
    });
    await expect(readRecords(holder, input({ part: "assets" }))).rejects.toThrow(
      "Not available to an assistant.",
    );
  });

  test("the tool's input holds only a part, a page and a language", () => {
    expect(Object.keys(ReadRecordsInput.shape).toSorted()).toEqual([
      "language",
      "page",
      "part",
    ]);
  });
});
