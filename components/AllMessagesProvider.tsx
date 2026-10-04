import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { clientMessages } from "@/lib/client-messages";

/**
 * Every namespace, for the client components of a route that reads more than the public ones the
 * locale layout hands over (`PUBLIC_CLIENT_NAMESPACES`). Rendered by that route's layout around
 * everything it shows. A nested provider replaces its parent's messages rather than adding to
 * them, which is why this passes the whole set.
 */
export async function AllMessagesProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider messages={clientMessages(await getMessages())}>
      {children}
    </NextIntlClientProvider>
  );
}
