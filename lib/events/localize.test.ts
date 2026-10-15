import { describe, expect, test } from "bun:test";
import { getEventsData } from "./index";
import { czechEventNotes, localizeEvents } from "./localize";

const { events } = getEventsData();

describe("the Czech event notes", () => {
  test("every event with notes has Czech notes", () => {
    const missing = events
      .filter((event) => event.notes !== "" && czechEventNotes[event.id] === undefined)
      .map((event) => event.id);
    expect(missing).toEqual([]);
  });

  test("hold no event the feed does not have", () => {
    const ids = new Set(events.map((event) => event.id));
    expect(Object.keys(czechEventNotes).filter((id) => !ids.has(id))).toEqual([]);
  });
});

describe("localizeEvents", () => {
  const event = events.find((e) => e.notes !== "");
  if (event === undefined) throw new Error("no event has notes");

  test("only a Czech page swaps the notes, and nothing else changes", () => {
    expect(localizeEvents([event], "de")[0]).toEqual(event);
    const [czech] = localizeEvents([event], "cs");
    expect(czech?.notes).toBe(czechEventNotes[event.id]?.notes ?? "");
    expect({ ...czech, notes: event.notes }).toEqual(event);
  });
});
