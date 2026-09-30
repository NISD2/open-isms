"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import superjson from "superjson";
import { TRPC_MAX_BATCH_SIZE } from "./batch";
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
          // directly. The server's errorFormatter already replaces any
          // message nobody wrote on purpose with an English generic line;
          // this shows the server's wording only for the codes the
          // application raises on purpose, and the translated generic line
          // for anything else.
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
          maxItems: TRPC_MAX_BATCH_SIZE,
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
