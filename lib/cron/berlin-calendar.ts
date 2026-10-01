/**
 * Calendar days and hours in Berlin, for jobs that run once a day by the German clock whatever the
 * server's time zone. Pure, so it can be tested without a database.
 */
const TIME_ZONE = "Europe/Berlin";

/** The calendar day in Berlin, as YYYY-MM-DD. */
export const berlinDay = (at: Date): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(at);

/** The hour of the day in Berlin, 0 to 23. */
export const berlinHour = (at: Date): number =>
  Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(at),
  );
