import "@/lib/server-guard";
import { Resend } from "resend";
import { env } from "@/lib/env";

// Lazy: the Resend SDK constructor throws if the key is missing, which
// happens during `next build` page-data collection when SKIP_ENV_VALIDATION
// is set and runtime secrets aren't on PATH. Defer instantiation to first
// access so build-time imports succeed; real key is bound on first call
// at runtime.
let _resend: Resend | null = null;

/**
 * Stub Resend client used in local development. Returns a fake success
 * response for any `emails.send` call so calling code doesn't crash.
 * Defense-in-depth — primary guard is in `sendMail()`, this catches any
 * future direct callers that bypass `sendMail()`.
 */
function makeDevStub(): Resend {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    emails: {
      send: async (opts: { to: string | string[]; subject?: string }) => {
        const to = Array.isArray(opts.to) ? opts.to.join(", ") : opts.to;
        console.log(
          `[mail.resend] dev-stub — would send to=${to} subject="${opts.subject ?? ""}"`,
        );
        return { data: { id: "dev-stub" }, error: null };
      },
    },
  } as unknown as Resend;
}

function getResend(): Resend {
  if (!_resend) {
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.ENABLE_EMAIL_IN_DEV !== "true"
    ) {
      _resend = makeDevStub();
    } else {
      _resend = new Resend(env.RESEND_API_KEY);
    }
  }
  return _resend;
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop, receiver) {
    return Reflect.get(getResend(), prop, receiver);
  },
}) as Resend;

export const FROM_EMAIL = env.RESEND_FROM_EMAIL;
