"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface TermHoverContextValue {
  activeTermSlug: string | null;
  setActiveTermSlug: (slug: string | null) => void;
}

const TermHoverContext = createContext<TermHoverContextValue>({
  activeTermSlug: null,
  setActiveTermSlug: () => {},
});

export function TermHoverProvider({ children }: { children: ReactNode }) {
  const [activeTermSlug, setActiveTermSlugRaw] = useState<string | null>(null);
  const setActiveTermSlug = useCallback((slug: string | null) => {
    setActiveTermSlugRaw(slug);
  }, []);

  return (
    <TermHoverContext value={{ activeTermSlug, setActiveTermSlug }}>
      {children}
    </TermHoverContext>
  );
}

export function useTermHover() {
  return useContext(TermHoverContext);
}
