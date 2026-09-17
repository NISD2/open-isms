"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import superjson from "superjson";
import { trpc } from "./client";
import { userFacingError } from "./error-message";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  // Read through a ref so the MutationCache, built once in the useState
  // initializer, never closes over a stale translator.
  const t = useTranslations("common");
  const tRef = useRef(t);
  tRef.current = t;

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000 } },
        mutationCache: new MutationCache({
          // The one place a failed mutation becomes visible. Without it an
          // unhandled tRPC failure looks like "nothing happened"; local
          // onError handlers take precedence and opt out of this.
          //
          // Routed through userFacingError rather than toasting error.message
          // directly. tRPC runs without an errorFormatter, so an unexpected
          // exception arrives with its original text attached — a Postgres
          // error, an S3 endpoint, a signed-URL fragment — and this handler
          // was putting whatever that happened to say on screen. Now the
          // server's own wording shows only for the codes the application
          // raises on purpose, and anything else gets the generic line.
          onError: (error, _variables, _context, mutation) => {
            if (mutation.options.onError) return;
            toast.error(userFacingError(error, tRef.current("actionFailed")));
          },
        }),
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
