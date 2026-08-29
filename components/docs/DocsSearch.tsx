"use client";

import { useEffect, useState } from "react";
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
 * matched by cmdk. Not full-text — that needs an index, and 22 pages with
 * honest titles do not.
 */
export function DocsSearch() {
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-full items-center gap-2 rounded-md border border-border bg-muted/40 pl-2.5 pr-2 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted"
      >
        <Search className="size-3.5 shrink-0" aria-hidden="true" />
        <span>Search docs</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-background px-1.5 font-mono text-[0.6875rem] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search documentation"
        description="Find a page by title or topic"
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
    </>
  );
}
