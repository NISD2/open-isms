import { describe, expect, test } from "bun:test";
import { getTimelineData } from "./index";
import { czechTimeline, localizeTimeline } from "./localize";

const { events } = getTimelineData();

describe("the Czech timeline", () => {
  test("every event has its Czech title and summary", () => {
    expect(
      events.filter((event) => czechTimeline[event.id] === undefined).map((e) => e.id),
    ).toEqual([]);
  });

  test("holds no event the timeline does not have", () => {
    const ids = new Set(events.map((event) => event.id));
    expect(Object.keys(czechTimeline).filter((id) => !ids.has(id))).toEqual([]);
  });
});

describe("localizeTimeline", () => {
  const event = events[0];
  if (event === undefined) throw new Error("the timeline is empty");

  test("German readers get the German text, other languages the English", () => {
    expect(localizeTimeline([event], "de")[0]?.title).toBe(event.titleDe);
    expect(localizeTimeline([event], "en")[0]?.summary).toBe(event.summary);
    expect(localizeTimeline([event], "fr")[0]?.title).toBe(event.title);
  });

  test("Czech readers get the Czech text, and the facts stay", () => {
    const [czech] = localizeTimeline([event], "cs");
    expect(czech?.title).toBe(czechTimeline[event.id]?.title ?? "");
    expect(czech?.date).toBe(event.date);
    expect(czech?.sourceUrl).toBe(event.sourceUrl);
  });
});
