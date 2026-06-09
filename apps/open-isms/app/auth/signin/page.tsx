import { signIn } from "@/lib/auth";

export const metadata = {
  title: "Sign in — open-isms",
};

export default function SignInPage() {
  async function handleSignIn(formData: FormData) {
    "use server";
    const email = formData.get("email");
    if (typeof email !== "string" || !email.includes("@")) {
      throw new Error("invalid email");
    }
    await signIn("email", { email, redirectTo: "/dashboard" });
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a one-time sign-in link.
            New here? Just enter your email — your account is created the first
            time you click a link.
          </p>
        </div>

        <form action={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Send magic link
          </button>
        </form>

        <p className="text-xs text-muted-foreground">
          In dev mode (no EMAIL_SERVER set), the magic link is written to the
          server logs instead of emailed. See <code>docker compose logs app</code>.
        </p>
      </div>
    </main>
  );
}
