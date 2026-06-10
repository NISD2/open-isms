"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#fafafa",
          color: "#111",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            An unexpected error occurred. Please try again.
          </p>
          {process.env.NODE_ENV === "development" && (
            <pre
              style={{
                textAlign: "left",
                background: "#f1f1f1",
                padding: "1rem",
                borderRadius: "0.5rem",
                fontSize: "0.8rem",
                overflow: "auto",
                maxWidth: "600px",
                marginBottom: "1.5rem",
              }}
            >
              {error.message}
            </pre>
          )}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "1px solid #ccc",
                background: "#fff",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                background: "#111",
                color: "#fff",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              Go to dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
