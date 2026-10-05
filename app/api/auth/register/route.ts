import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { after, NextResponse } from "next/server";
import { checkEmailQuality } from "@/lib/auth/email-quality";
import { OtpRateLimitedError, requestOtp } from "@/lib/auth/otp";
import { signupCampaignFrom } from "@/lib/auth/signup-campaign";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { isLocaleCode, type LocaleCode } from "@/lib/locale";
import { registrationAttemptEmail, sendAuthCode, sendMail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { type Locale, localizedAbsoluteUrl } from "@/lib/seo";
import { type SignupCampaign, user } from "@/schema";

// Rate limit: max 5 attempts per IP per 15 minutes
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

// The owner notice says the same thing every time, so one an hour is enough
// to inform and too few to flood a mailbox by registering its address in a loop.
const NOTICE_WINDOW_MS = 60 * 60 * 1000;
const NOTICE_MAX = 1;

/**
 * Registration with email verification.
 *
 * Flow:
 *   POST /api/auth/register { email, password, locale?, campaign? }
 *     → returns 200 { success: true, verificationRequired: true }
 *     → after the response: creates the user with `emailVerifiedAt: null`
 *       (or leaves a pending-verify one as it is) and mails a 6-digit OTP
 *
 *   client then collects the code from the user and POSTs to
 *   /api/auth/verify-email { email, code }
 *
 *   only then can the user sign in via Credentials — `authorize()` blocks
 *   accounts with a null `emailVerifiedAt`.
 *
 * Every address gets the same body, status and timing (audit H-4): the
 * response goes out before the address is looked up, and everything that
 * depends on it runs in `after()`. An address that already has a verified
 * account gets a notice to its owner instead of a code, and one past the
 * per-email code limit simply gets no mail.
 *
 * Locale comes from the request body so the email arrives in the right
 * language. Defaults to "de" for the German market.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  if (!(await rateLimit(`auth:register:${ip}`, MAX_ATTEMPTS, WINDOW_MS))) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email as string | undefined)?.toLowerCase().trim();
  // Type-checked rather than cast: see the note on the same guard in
  // /api/auth/verify-email. A non-string is truthy, `.length` on it is
  // undefined, and every comparison against undefined is false, so it reaches
  // bcrypt.hash and 500s instead of being answered with a 400.
  const password = body.password;
  const localeInput = body.locale as string | undefined;
  // Validated against the full app locale list: the OTP templates carry copy
  // for all 10 locales, and the same value is persisted on the user row so
  // emails sent outside a request (lifecycle crons) can localize later.
  // Unknown values stay null on the row and fall back to "de" for the email.
  const persistedLocale: LocaleCode | null = isLocaleCode(localeInput)
    ? localeInput
    : null;
  const campaign = signupCampaignFrom(body.campaign);

  if (!email || typeof password !== "string" || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  if (email.length > 255) {
    return NextResponse.json({ error: "Input too long" }, { status: 400 });
  }

  if (password.length < 8 || password.length > 128) {
    return NextResponse.json(
      { error: "Password must be 8-128 characters" },
      { status: 400 },
    );
  }

  after(() => register({ email, password, persistedLocale, campaign }));

  return NextResponse.json({ success: true, verificationRequired: true });
}

async function register({
  email,
  password,
  persistedLocale,
  campaign,
}: {
  email: string;
  password: string;
  persistedLocale: LocaleCode | null;
  campaign: SignupCampaign | null;
}): Promise<void> {
  const locale: Locale = persistedLocale ?? "de";
  try {
    const existing = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: { id: true, emailVerifiedAt: true, locale: true, signupCampaign: true },
    });

    // Verified account: nothing is created or changed. Forgotten password
    // belongs in /api/auth/forgot-password, which proves mailbox ownership
    // before mutating anything; the notice points the owner there.
    if (existing?.emailVerifiedAt) {
      await notifyOwner(email, isLocaleCode(existing.locale) ? existing.locale : locale);
      return;
    }

    const quality = await checkEmailQuality(email);
    const disposable = quality.block;

    if (existing) {
      // Pending-verify account exists. Re-issue the OTP so the user can
      // finish signing up if they lost the original mail. CRITICAL (audit
      // C-1): never overwrite passwordHash here. Without an ownership
      // proof the overwrite lets an attacker hijack any not-yet-verified
      // address by simply re-POSTing /register with their own password.
      //
      // The password the user just typed is not discarded, it is deferred:
      // /api/auth/verify-email commits it in the request that carries the
      // correct code, which is the ownership proof this request lacks. Before
      // that existed, a second registration kept the first password and the
      // signup dead-ended after a correct code — see the note on that route.
      // Forgotten-password recovery still belongs in /api/auth/forgot-password.
      await db
        .update(user)
        .set({
          isDisposableEmail: disposable,
          // Pre-verification retry may come from a different-locale page;
          // the latest choice wins. Locale is not credential-bearing, so
          // updating it here is safe where passwordHash is not (audit C-1).
          ...(persistedLocale ? { locale: persistedLocale } : {}),
          // Unlike locale, the first stored campaign stays: anyone who knows an unverified address
          // could otherwise rewrite which ad the account is attributed to.
          ...(campaign && !existing.signupCampaign ? { signupCampaign: campaign } : {}),
          updatedAt: new Date(),
        })
        .where(eq(user.id, existing.id));
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      const name = email.split("@")[0];
      // onConflictDoNothing guards against two concurrent registrations for the
      // same new email racing past the findFirst check and both attempting the
      // insert — without this the loser hits a unique-constraint 500.
      await db
        .insert(user)
        .values({
          email,
          name,
          passwordHash,
          isDisposableEmail: disposable,
          locale: persistedLocale,
          signupCampaign: campaign,
          // emailVerifiedAt left null — set by /api/auth/verify-email
        })
        .onConflictDoNothing({ target: user.email });
    }

    // Disposable email: user record is kept so we can see the scoping/bot
    // signup in admin, but we never issue an OTP. The account stays
    // permanently unverified and unable to sign in.
    if (disposable) {
      console.log(`[register] Silent block (${quality.reason}):`, email.split("@")[1]);
      return;
    }

    const { code } = await requestOtp(email, "email_verify");
    await sendAuthCode({ to: email, code, locale, kind: "verification" });
  } catch (err) {
    // Past the per-email code limit: no mail, and the response already said
    // the same as for everyone else.
    if (err instanceof OtpRateLimitedError) return;
    console.error("[register] background registration failed:", err);
  }
}

async function notifyOwner(email: string, locale: Locale): Promise<void> {
  if (!(await rateLimit(`auth:register-notice:${email}`, NOTICE_MAX, NOTICE_WINDOW_MS))) {
    return;
  }
  await sendMail({
    emailType: "auth.registration_attempt",
    to: email,
    ...(await registrationAttemptEmail({
      signInUrl: localizedAbsoluteUrl("/auth/signin", locale),
      resetUrl: localizedAbsoluteUrl("/auth/forgot-password", locale),
      locale,
    })),
  });
}
