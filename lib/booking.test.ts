import { describe, expect, test } from "bun:test";
import { BOOKING_URL, bookerFrameUrl, bookingUrlFor } from "./booking";

describe("bookingUrlFor", () => {
  test("no query gives the plain booking page", () => {
    expect(bookingUrlFor("")).toBe(BOOKING_URL);
  });

  test("hands on campaign tags, nothing else", () => {
    expect(
      bookingUrlFor(
        "?utm_source=google&utm_term=nis2%20umsetzen&callbackUrl=/invite/abc&gclid=x",
      ),
    ).toBe(`${BOOKING_URL}?utm_source=google&utm_term=nis2+umsetzen`);
  });

  test("a query without campaign tags gives the plain booking page", () => {
    expect(bookingUrlFor("?callbackUrl=/invite/abc")).toBe(BOOKING_URL);
  });
});

describe("bookerFrameUrl", () => {
  test("embed mode with campaign tags, nothing else", () => {
    expect(bookerFrameUrl("?utm_source=google&callbackUrl=/invite/abc&gclid=x")).toBe(
      `${BOOKING_URL}?embed=true&theme=light&layout=month_view&utm_source=google`,
    );
  });
});
