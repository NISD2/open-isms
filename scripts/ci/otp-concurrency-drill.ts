/**
 * verifyOtp against a real Postgres: parallel requests must not get more than
 * the attempt cap out of one code, and one code must not be accepted twice. A
 * fake database cannot show either, because both depend on how concurrent
 * UPDATEs see each other. Before the fix, 20 parallel wrong guesses were
 * recorded as one attempt and 10 parallel correct submissions all succeeded.
 *
 *   DATABASE_URL=postgres://... AUTH_SECRET=<32+ chars> bun scripts/ci/otp-concurrency-drill.ts
 *
 * Expects a migrated database (runs after bootstrap-admin-drill.sh in CI).
 */
import { eq } from "drizzle-orm";
import { requestOtp, verifyOtp } from "@/lib/auth/otp";
import { db } from "@/lib/db";
import { emailOtp } from "@/schema";

const EMAIL = "otp-drill@example.test";
const PURPOSE = "password_reset";
const MAX_ATTEMPTS = 5;

const burst = (code: string, n: number) =>
  Promise.all(Array.from({ length: n }, () => verifyOtp(EMAIL, code, PURPOSE)));

/** A six-digit code that is certainly not `code`. */
const wrongCode = (code: string) => (code === "100000" ? "100001" : "100000");

const clear = () => db.delete(emailOtp).where(eq(emailOtp.email, EMAIL));

async function wrongGuessesAreCapped(): Promise<string | null> {
  await clear();
  const { code } = await requestOtp(EMAIL, PURPOSE);
  await burst(wrongCode(code), 20);
  const [row] = await db
    .select({ attempts: emailOtp.attempts, consumedAt: emailOtp.consumedAt })
    .from(emailOtp)
    .where(eq(emailOtp.email, EMAIL));
  if (row?.attempts !== MAX_ATTEMPTS || row.consumedAt === null) {
    return `20 parallel wrong guesses left attempts=${row?.attempts} consumed=${row?.consumedAt != null}; expected ${MAX_ATTEMPTS} and consumed`;
  }
  return (await verifyOtp(EMAIL, code, PURPOSE))
    ? "the right code still worked after the attempt cap was spent"
    : null;
}

async function oneCodeOneSuccess(): Promise<string | null> {
  await clear();
  const { code } = await requestOtp(EMAIL, PURPOSE);
  const accepted = (await burst(code, 10)).filter(Boolean).length;
  return accepted === 1
    ? null
    : `10 parallel submissions of the right code were accepted ${accepted} times; expected 1`;
}

const failures = [await wrongGuessesAreCapped(), await oneCodeOneSuccess()].filter(
  (f): f is string => f !== null,
);
await clear();

for (const f of failures) console.error(`[drill] FAIL: ${f}`);
if (failures.length === 0) {
  console.log(
    "[drill] OK: OTP attempts stay capped and a code is accepted once under concurrency",
  );
}
process.exit(failures.length === 0 ? 0 : 1);
