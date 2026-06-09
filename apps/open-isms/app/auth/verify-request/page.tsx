export const metadata = {
  title: "Check your email — open-isms",
};

export default function VerifyRequestPage() {
  return (
    <main className="mx-auto max-w-md p-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          A sign-in link has been sent to your email address. The link is valid
          for one hour.
        </p>
        <p className="text-xs text-muted-foreground">
          Self-host dev tip: if you didn&apos;t configure <code>EMAIL_SERVER</code>,
          the link is in the server logs (<code>docker compose logs app</code>).
        </p>
      </div>
    </main>
  );
}
