/**
 * The hour in Berlin, for jobs that start by the German clock whatever the server's time zone.
 * Pure, so it can be tested without a database.
 */
export const berlinHour = (at: Date): number =>
  Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(at),
  );
