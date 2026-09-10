/**
 * `setLocale` is a public procedure that writes to the user table, which is an
 * unusual enough shape to be worth pinning rather than trusting to review.
 *
 * Two things have to stay true. A signed-out call must touch no row at all
 * (`db` here throws if anything reaches it). And a signed-in call must write to
 * `ctx.userId` and nothing the caller supplied, because the only reason it is
 * safe to leave this procedure public is that the caller names a language and
 * never names a user.
 */
import { describe, expect, test } from "bun:test";
import type { TRPCContext } from "../init";
import { createCallerFactory } from "../init";
import { userRouter } from "./user";

type Recorded = { set: Record<string, unknown>; where: unknown };

/**
 * The thinnest thing that satisfies the drizzle chain the mutation uses.
 * `where` resolves the promise, so the mutation's `await` completes.
 */
function recordingDb(recorded: Recorded[]) {
  return {
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: (condition: unknown) => {
          recorded.push({ set: values, where: condition });
          return Promise.resolve();
        },
      }),
    }),
  };
}

const REFUSING_DB = new Proxy(
  {},
  {
    get(_target, prop) {
      throw new Error(`signed-out setLocale touched the database: .${String(prop)}`);
    },
  },
);

function callerWith(ctx: Partial<TRPCContext>) {
  const base = {
    session: null,
    userId: null,
    companyId: null,
    ip: "test",
    userAgent: null,
  };
  return createCallerFactory(userRouter)({ ...base, ...ctx } as TRPCContext);
}

describe("user.setLocale", () => {
  test("signed out: reports nothing persisted and never reaches the db", async () => {
    const caller = callerWith({ db: REFUSING_DB as TRPCContext["db"] });

    expect(await caller.setLocale({ locale: "en" })).toEqual({ persisted: false });
  });

  test("signed in: writes the locale", async () => {
    const recorded: Recorded[] = [];
    const caller = callerWith({
      userId: "user-1",
      db: recordingDb(recorded) as unknown as TRPCContext["db"],
    });

    expect(await caller.setLocale({ locale: "en" })).toEqual({ persisted: true });
    expect(recorded).toHaveLength(1);
    expect(recorded[0].set.locale).toBe("en");
  });

  test("signed in: writes the locale column and nothing else", async () => {
    // Two things at once. A future edit that widened the input into a
    // `.set(input)` spread would let a caller write role, email or
    // passwordHash through a public procedure. And `updatedAt` staying out is
    // deliberate: platform-admin's unsubscribe view orders by
    // desc(user.updatedAt) to mean "recently unsubscribed", and a language
    // switch bumping it would misdate that list.
    const recorded: Recorded[] = [];
    const caller = callerWith({
      userId: "user-1",
      db: recordingDb(recorded) as unknown as TRPCContext["db"],
    });

    await caller.setLocale({ locale: "nl" });

    expect(Object.keys(recorded[0].set)).toEqual(["locale"]);
  });

  test("rejects a locale the app does not serve", async () => {
    const caller = callerWith({
      userId: "user-1",
      db: REFUSING_DB as TRPCContext["db"],
    });

    // Not a 500 from the column's varchar(10), and not a silent write: the
    // input schema refuses it before ctx.db is ever reached.
    for (const locale of ["DE", "da", "", "de-AT", "'; drop table user; --"]) {
      await expect(caller.setLocale({ locale })).rejects.toThrow();
    }
  });
});
