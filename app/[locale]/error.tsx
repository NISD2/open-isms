"use client";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-left bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-xs overflow-auto mb-6">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-4 py-2 text-sm rounded-md bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
