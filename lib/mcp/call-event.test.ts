import { describe, expect, test } from "bun:test";
import { callEvent, MCP_READ, MCP_REFUSED } from "./call-event";

describe("the event an assistant's call adds to the company's log", () => {
  test("a read logs a read, naming the tool", () => {
    expect(callEvent("get_walkthrough", { ok: true, data: {} }, true)).toEqual({
      action: MCP_READ,
      description: "get_walkthrough",
    });
  });

  test("a save logs nothing here: the app's procedures already log every one", () => {
    expect(callEvent("fill_walkthrough_item", { ok: true, data: {} }, false)).toBeNull();
  });

  test("a refusal logs the tool and why, for reads and writes alike", () => {
    for (const readOnly of [true, false]) {
      expect(
        callEvent("upload_file", { ok: false, message: "Not in the plan." }, readOnly),
      ).toEqual({ action: MCP_REFUSED, description: "upload_file: Not in the plan." });
    }
  });

  test("a long reason is cut, so the row stays a line", () => {
    const event = callEvent(
      "fill_walkthrough_item",
      { ok: false, message: "x".repeat(5000) },
      false,
    );
    expect(event?.description.length).toBeLessThanOrEqual(
      "fill_walkthrough_item: ".length + 300,
    );
  });
});
