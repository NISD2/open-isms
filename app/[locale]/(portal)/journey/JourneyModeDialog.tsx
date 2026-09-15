"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { JourneyModeCards, journeyModeCopy } from "./JourneyModeCards";
import type { JourneyMode } from "./journey-mode";

type Locale = "en" | "de" | "nl";

/**
 * The fork question, asked once on the first visit to the journey.
 *
 * A modal rather than a page: the path is already rendered behind it, so the
 * question reads as "which of these two" against something real instead of
 * stopping a new account on a blank screen before it has seen anything.
 *
 * It has no close button and does not dismiss on escape or an outside click.
 * That is not a dark pattern here: both answers take one click, both lead
 * straight to a working path, and the toggle in the page header reverses the
 * choice. Letting it be dismissed would only mean guessing on their behalf,
 * which is the thing this replaces.
 */
export function JourneyModeDialog({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, setPending] = useState<JourneyMode | null>(null);
  const setMode = trpc.journey.setMode.useMutation({
    onSuccess: () => router.refresh(),
    onError: () => setPending(null),
  });
  const copy = journeyModeCopy(locale);

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>{copy.question}</DialogTitle>
          <DialogDescription>{copy.lede}</DialogDescription>
        </DialogHeader>
        <JourneyModeCards
          locale={locale}
          pending={pending}
          onSelect={(mode) => {
            setPending(mode);
            setMode.mutate({ mode });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
