"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { JourneyModeCards } from "./JourneyModeCards";
import type { JourneyMode } from "./journey-mode";

type Locale = "en" | "de" | "nl";

/** Persists the answer to the fork question, then re-renders the chosen path. */
export function JourneyModeChoice({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, setPending] = useState<JourneyMode | null>(null);
  const setMode = trpc.journey.setMode.useMutation({
    onSuccess: () => router.refresh(),
    onError: () => setPending(null),
  });

  return (
    <JourneyModeCards
      locale={locale}
      pending={pending}
      onSelect={(mode) => {
        setPending(mode);
        setMode.mutate({ mode });
      }}
    />
  );
}
