"use client";

import { useLocale } from "next-intl";
import { pickLocalized } from "@/lib/locale";

/**
 * Written here rather than in messages: an error boundary has to render even when what failed was
 * loading the page's messages.
 */
const COPY = {
  en: {
    title: "Something went wrong",
    body: "An unexpected error occurred. Please try again or return to the dashboard.",
    retry: "Try again",
    home: "Go to dashboard",
  },
  de: {
    title: "Etwas ist schiefgelaufen",
    body: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kehren Sie zum Dashboard zurück.",
    retry: "Erneut versuchen",
    home: "Zum Dashboard",
  },
  cs: {
    title: "Něco se pokazilo",
    body: "Došlo k neočekávané chybě. Zkuste to prosím znovu nebo se vraťte na nástěnku.",
    retry: "Zkusit znovu",
    home: "Na nástěnku",
  },
};

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = pickLocalized(COPY, useLocale());
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-bold mb-2">{copy.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{copy.body}</p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-left bg-muted p-3 rounded-lg text-xs overflow-auto mb-6">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent"
          >
            {copy.retry}
          </button>
          <a
            href="/"
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            {copy.home}
          </a>
        </div>
      </div>
    </div>
  );
}
