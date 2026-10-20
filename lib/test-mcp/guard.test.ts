import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import type { TestHolder } from "./context";
import { createGuard, MAX_CHARS, text } from "./guard";
import { MAX_STRING_CHARS, shownValue } from "./sanitize";

const holder: TestHolder = {
  userId: "11111111-1111-4111-8111-111111111111",
  email: "ops@example.org",
  keyId: "key-1",
  ip: null,
  userAgent: null,
};
const ok = { content: [{ type: "text" as const, text: "ran" }] };

/** A guard over fakes that write what they were asked to do into one list, in order. */
function guard(
  options: { allow?: (key: string) => boolean; recordFails?: boolean } = {},
) {
  const events: string[] = [];
  const guarded = createGuard({
    rateLimit: async (key) => {
      events.push(`limit ${key.split(":")[0]}`);
      return options.allow ? options.allow(key) : true;
    },
    record: async (_holder, tool) => {
      events.push(`record ${tool}`);
      if (options.recordFails) throw new Error("audit table unavailable");
    },
  });
  return { events, guarded };
}

const message = (result: { content: Array<{ type: string; text?: string }> }) =>
  result.content[0]?.text;

describe("a guarded call", () => {
  // The guard logs an unexpected failure; the expected ones below should not fill the test log.
  let silence: ReturnType<typeof spyOn>;
  beforeEach(() => {
    silence = spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => silence.mockRestore());

  test("limits, then records, then runs", async () => {
    const { events, guarded } = guard();
    const result = await guarded("event_log", holder, async () => {
      events.push("run");
      return ok;
    })({});
    expect(events).toEqual(["limit test-mcp", "record event_log", "run"]);
    expect(result).toBe(ok);
  });

  test("a large lookup also draws on its smaller budget, before anything is recorded", async () => {
    const { events, guarded } = guard();
    await guarded("usage_stats", holder, async () => ok, "heavy")({});
    expect(events).toEqual([
      "limit test-mcp",
      "limit test-mcp-heavy",
      "record usage_stats",
    ]);
  });

  test("a spent budget refuses the call before it is recorded or run", async () => {
    let ran = false;
    const { events, guarded } = guard({ allow: () => false });
    const result = await guarded("event_log", holder, async () => {
      ran = true;
      return ok;
    })({});
    expect(result.isError).toBe(true);
    expect(ran).toBe(false);
    expect(events).toEqual(["limit test-mcp"]);
  });

  test("a spent heavy budget refuses a large lookup but not a light one", async () => {
    const { guarded } = guard({ allow: (key) => !key.startsWith("test-mcp-heavy:") });
    const heavy = await guarded("usage_stats", holder, async () => ok, "heavy")({});
    const light = await guarded("find_users", holder, async () => ok)({});
    expect(heavy.isError).toBe(true);
    expect(light).toBe(ok);
  });

  test("a read that cannot be recorded is not made, and the answer says nothing of why", async () => {
    let ran = false;
    const { guarded } = guard({ recordFails: true });
    const result = await guarded("event_log", holder, async () => {
      ran = true;
      return ok;
    })({});
    expect(ran).toBe(false);
    expect(result.isError).toBe(true);
    expect(message(result)).toBe("Something went wrong. Try again in a moment.");
    expect(message(result)).not.toContain("audit");
  });

  test("a failure inside the tool is a plain refusal too", async () => {
    const { guarded } = guard();
    const result = await guarded("event_log", holder, async () => {
      throw new Error('relation "audit_log" does not exist');
    })({});
    expect(result.isError).toBe(true);
    expect(message(result)).toBe("Something went wrong. Try again in a moment.");
  });
});

describe("what an answer looks like once it is text", () => {
  test("every string inside a stored value is cut to the string limit, so a long one is not dead weight", () => {
    const shown = shownValue({ a: "x".repeat(700), b: "y".repeat(700) });
    const out = JSON.parse(message(text({ saved: shown })) ?? "null");
    expect(out.saved.a.length).toBe(MAX_STRING_CHARS + 1);
    expect(out.saved.b.length).toBe(MAX_STRING_CHARS + 1);
  });

  test("a value past the value limit arrives as a short preview with its length", () => {
    const shown = shownValue({ text: "z".repeat(5_000) });
    const answer = message(text({ saved: shown })) ?? "";
    expect(answer.length).toBeLessThan(MAX_STRING_CHARS + 200);
    expect(JSON.parse(answer).saved).toMatchObject({ cut: true, totalChars: 5_011 });
  });

  test("an answer over the limit is cut and says so", () => {
    const answer = message(text({ rows: "r".repeat(MAX_CHARS * 2).split("") })) ?? "";
    expect(answer).toContain(`cut at ${MAX_CHARS} characters`);
  });
});
