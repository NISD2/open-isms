"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Copy text to the clipboard, with the two bits of feedback every caller in
 * this codebase was writing by hand: a short-lived `copied` flag for swapping
 * an icon, and a toast.
 *
 * Seven components had grown their own version of this, split between the two
 * styles, so the behaviour drifted: some told you nothing on failure, and a
 * couple left a `setTimeout` running after unmount. One place to fix both.
 *
 * `navigator.clipboard` is undefined on insecure origins and can reject when
 * the document is not focused, so the failure path is real and reports rather
 * than silently doing nothing.
 */
export function useCopy({ resetAfterMs = 2000 }: { resetAfterMs?: number } = {}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(
    async (text: string, message?: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), resetAfterMs);
        if (message) toast.success(message);
        return true;
      } catch {
        if (message) toast.error(message);
        return false;
      }
    },
    [resetAfterMs],
  );

  return { copied, copy };
}
