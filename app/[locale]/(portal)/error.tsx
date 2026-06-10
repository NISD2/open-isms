"use client";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-6">
          An unexpected error occurred. Please try again or return to the
          dashboard.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-left bg-muted p-3 rounded-lg text-xs overflow-auto mb-6">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
