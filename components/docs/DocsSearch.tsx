"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DOCS_SECTIONS } from "@/lib/docs/toc";

/**
 * Page search over the table of contents: titles and one-line descriptions,
 * matched by cmdk. Not full-text — that needs an index, and 24 pages with
 * honest titles do not.
 *
 * Split into a provider and a trigger because the layout needs the button in
 * two places: the sidebar on large screens, and a row above the article on
 * small ones. A self-contained component rendered twice mounted two dialogs
 * and two ⌘K listeners, and since a dialog portals to the body, the
 * `lg:hidden` on the mobile wrapper did not hide its dialog: pressing ⌘K
 * opened both, stacked, one showing filtered results and one not.
 */

interface DocsSearchContext {
  open: () => void;
}

const Context = createContext<DocsSearchContext | null>(null);

export function DocsSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ open: () => setOpen(true) }), []);

  return (
    <Context.Provider value={value}>
      {children}

      {/*
        The dialog's own default is the viewport minus a 2rem gutter, which
        made the palette wider than the page behind it. max-w-xl is half the
        page's max-w-6xl: enough for a title and its one-line description,
        narrow enough to read as a palette rather than a second page.
      */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search documentation"
        description="Find a page by title or topic"
        className="w-[calc(100%-2rem)] max-w-xl"
      >
        <CommandInput placeholder="Search documentation" />
        <CommandList>
          <CommandEmpty>No page matches that.</CommandEmpty>
          {DOCS_SECTIONS.map((section) => (
            <CommandGroup key={section.slug} heading={section.title}>
              {section.pages.map((page) => (
                <CommandItem
                  key={page.slug}
                  value={`${section.title} ${page.title} ${page.description}`}
                  onSelect={() => {
                    setOpen(false);
                    router.push(`/docs/${section.slug}/${page.slug}`);
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{page.title}</span>
                    <span className="text-xs text-muted-foreground">{page.description}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </Context.Provider>
  );
}

export function DocsSearchTrigger() {
  const context = useContext(Context);
  if (!context) throw new Error("DocsSearchTrigger must be used inside DocsSearchProvider");

  return (
    <button
      type="button"
      onClick={context.open}
      // shrink-0 is load-bearing: in the sidebar this sits in a flex column
      // next to the full navigation tree, and a flex item shrinks past its
      // height when the column overflows. Without it the button collapsed
      // onto its own icon and label.
      className="flex h-8 w-full shrink-0 items-center gap-2 rounded-md border border-border bg-muted/40 pl-3 pr-2.5 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted"
    >
      <Search className="size-3.5 shrink-0" aria-hidden="true" />
      <span>Search docs</span>
      <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-background px-1.5 font-mono text-[0.6875rem] text-muted-foreground sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
