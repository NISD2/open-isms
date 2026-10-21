import { describe, expect, test } from "bun:test";
import { getTimelineData, TIMELINE_IDS } from "./index";
import { czechTimeline, localizeTimeline } from "./localize";

const { events } = getTimelineData("nis2");

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
    const [czech] = localizeTimeline([event], "cs", czechTimeline);
    expect(czech?.title).toBe(czechTimeline[event.id]?.title ?? "");
    expect(czech?.date).toBe(event.date);
    expect(czech?.sourceUrl).toBe(event.sourceUrl);
  });

  test("Czech readers get English where a timeline has no Czech text", () => {
    expect(localizeTimeline([event], "cs")[0]?.title).toBe(event.title);
  });
});

describe.each(TIMELINE_IDS)("the %s timeline file", (id) => {
  const { events, sources } = getTimelineData(id);

  test("holds events", () => {
    expect(events.length).toBeGreaterThan(0);
  });

  test("gives every event a unique id", () => {
    const ids = events.map((event) => event.id);
    expect(ids.filter((value, i) => ids.indexOf(value) !== i)).toEqual([]);
  });

  test("registers the source of every event, and none is 'other'", () => {
    const known = new Set(sources.map((source) => source.id));
    expect(events.filter((event) => !known.has(event.sourceId)).map((e) => e.id)).toEqual(
      [],
    );
  });

  test("starts every id with the event's date", () => {
    expect(
      events.filter((event) => !event.id.startsWith(event.date)).map((e) => e.id),
    ).toEqual([]);
  });

  test("tags a national event with its country, the only two-letter tags", () => {
    expect(
      events
        .filter(
          (e) => e.category === "national" || e.category === "national-transposition",
        )
        .filter((e) => !e.tags.some((tag) => tag.length === 2))
        .map((e) => e.id),
    ).toEqual([]);
  });

  test("links only over https, since every url becomes an href on a public page", () => {
    const urls = [...events.map((e) => e.sourceUrl), ...sources.map((s) => s.url)];
    expect(urls.filter((url) => !url.startsWith("https://"))).toEqual([]);
  });

  test("keeps the house voice: no em-dash in any text", () => {
    const texts = events.flatMap((e) => [e.title, e.titleDe, e.summary, e.summaryDe]);
    expect(texts.filter((text) => text.includes("—"))).toEqual([]);
  });
});
