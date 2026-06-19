"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export interface WikiCategoryCard {
  slug: string;
  titleDe: string;
  /** de renders titleDe; every other locale renders this pre-resolved value. */
  titleLocalized: string;
  questionDe: string;
  questionLocalized: string;
  count: number;
}

export interface WikiFlatPage {
  href: string;
  categorySlug: string;
  pageSlug: string;
  titleDe: string;
  titleLocalized: string;
  summaryDe: string;
  summaryLocalized: string;
  categoryTitleDe: string;
  categoryTitleLocalized: string;
}

interface Props {
  categories: WikiCategoryCard[];
  allPages: WikiFlatPage[];
  locale: string;
}

const PAGE_SIZE = 8;

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function tokenMatch(haystack: string, query: string): boolean {
  if (!query.trim()) return true;
  const hay = normalize(haystack);
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  return tokens.every((t) => hay.includes(t));
}

function scorePage(p: WikiFlatPage, query: string, isDe: boolean): number {
  if (!query.trim()) return 0;
  const title = isDe ? p.titleDe : p.titleLocalized;
  const summary = isDe ? p.summaryDe : p.summaryLocalized;
  const cat = isDe ? p.categoryTitleDe : p.categoryTitleLocalized;
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  let score = 0;
  for (const t of tokens) {
    if (normalize(title).startsWith(t)) score += 12;
    if (normalize(title).includes(t)) score += 8;
    if (normalize(summary).includes(t)) score += 3;
    if (normalize(cat).includes(t)) score += 1;
  }
  return score;
}

/** Detect platform after mount to avoid SSR/CSR hydration mismatch on the ⌘/Ctrl kbd. */
function useIsMac(): boolean | null {
  const [isMac, setIsMac] = useState<boolean | null>(null);
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    }
  }, []);
  return isMac;
}

export function WikiHubSearch({ categories, allPages, locale }: Props) {
  // Chrome strings (search placeholder, "page"/"pages", hints) stay on the
  // original de/en split. Content strings (titles, questions, summaries,
  // category labels) are pre-resolved per locale by the page into the
  // *Localized fields, so they select on de-vs-everything-else.
  const isEn = locale === "en";
  const isDe = locale === "de";
  const isMac = useIsMac();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSearching = query.trim().length > 0;

  // ⌘K (or Ctrl+K) focuses the search input; Esc blurs/clears
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === "Escape" && document.activeElement === inputRef.current) {
        if (query) {
          setQuery("");
          setPage(1);
        } else {
          inputRef.current?.blur();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const matches = allPages.filter((p) => {
      const title = isDe ? p.titleDe : p.titleLocalized;
      const summary = isDe ? p.summaryDe : p.summaryLocalized;
      const cat = isDe ? p.categoryTitleDe : p.categoryTitleLocalized;
      return tokenMatch(`${title} ${summary} ${cat}`, q);
    });
    return matches
      .slice()
      .sort((a, b) => scorePage(b, q, isDe) - scorePage(a, q, isDe));
  }, [query, allPages, isDe]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  function onQueryChange(v: string) {
    setQuery(v);
    setPage(1);
  }

  return (
    <div className="space-y-8">
      {/* Search bar — always visible */}
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-colors"
        />
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filtered.length > 0) {
              e.preventDefault();
              router.push(filtered[0].href as never);
            }
          }}
          placeholder={
            isEn
              ? "Search the wiki…"
              : "Wiki durchsuchen…"
          }
          aria-label={isEn ? "Search the wiki" : "Wiki durchsuchen"}
          className={cn(
            "h-14 w-full rounded-xl border bg-background pl-12 pr-28 text-base shadow-sm outline-none",
            "transition-all duration-200",
            "placeholder:text-muted-foreground/70",
            "focus-visible:border-foreground/40 focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setPage(1);
                inputRef.current?.focus();
              }}
              aria-label={isEn ? "Clear search" : "Suche löschen"}
              className="pointer-events-auto inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : (
            isMac !== null && (
              <kbd
                className="hidden select-none items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 font-mono text-[11px] text-muted-foreground sm:inline-flex"
                aria-hidden
              >
                {isMac ? "⌘" : "Ctrl"}
                <span>K</span>
              </kbd>
            )
          )}
        </div>
      </div>

      {/* Browse state — cards (cross-fades with search results) */}
      <div className="relative">
        <div
          aria-hidden={isSearching}
          className={cn(
            "transition-all duration-300 ease-out",
            isSearching
              ? "pointer-events-none absolute inset-0 -translate-y-2 opacity-0"
              : "translate-y-0 opacity-100",
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/wiki/${cat.slug}` as never}
                className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="h-full rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-foreground/30 group-hover:shadow-md group-hover:bg-accent/30">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-foreground">
                      {isDe ? cat.titleDe : cat.titleLocalized}
                    </CardTitle>
                    <CardDescription>
                      {isDe ? cat.questionDe : cat.questionLocalized}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {cat.count}{" "}
                      {cat.count === 1
                        ? isEn
                          ? "page"
                          : "Seite"
                        : isEn
                          ? "pages"
                          : "Seiten"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Search state — results list */}
        <div
          aria-hidden={!isSearching}
          className={cn(
            "transition-all duration-300 ease-out",
            isSearching
              ? "translate-y-0 opacity-100"
              : "pointer-events-none absolute inset-0 translate-y-2 opacity-0",
          )}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {filtered.length === 0
                ? isEn
                  ? "No pages match your search."
                  : "Keine Seiten gefunden."
                : isEn
                  ? `${filtered.length} ${filtered.length === 1 ? "page" : "pages"}`
                  : `${filtered.length} ${filtered.length === 1 ? "Seite" : "Seiten"}`}
            </p>

            {filtered.length === 0 ? (
              <div className="rounded-xl border bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {isEn
                    ? "Try a different word, or browse the glossary for terminology."
                    : "Versuchen Sie ein anderes Stichwort, oder schauen Sie ins Glossar."}
                </p>
                <Link
                  href={"/wiki/grundlagen/glossar" as never}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
                >
                  {isEn ? "Open the glossary" : "Zum Glossar"}
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              <ul className="divide-y rounded-xl border bg-background/60">
                {visible.map((p) => (
                  <li key={`${p.categorySlug}/${p.pageSlug}`}>
                    <Link
                      href={p.href as never}
                      className="group flex items-start gap-4 p-4 transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge variant="outline" className="rounded-full text-[10px] font-normal">
                            {isDe ? p.categoryTitleDe : p.categoryTitleLocalized}
                          </Badge>
                        </div>
                        <h3 className="font-medium leading-snug group-hover:text-foreground">
                          {isDe ? p.titleDe : p.titleLocalized}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {isDe ? p.summaryDe : p.summaryLocalized}
                        </p>
                      </div>
                      <ArrowRight
                        aria-hidden
                        className="mt-1 size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <Pagination className="pt-2">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(Math.max(1, safePage - 1));
                      }}
                      aria-disabled={safePage === 1}
                      className={
                        safePage === 1
                          ? "pointer-events-none opacity-40"
                          : undefined
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <PaginationItem key={n}>
                      <PaginationLink
                        href="#"
                        isActive={n === safePage}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(n);
                        }}
                      >
                        {n}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(Math.min(totalPages, safePage + 1));
                      }}
                      aria-disabled={safePage === totalPages}
                      className={
                        safePage === totalPages
                          ? "pointer-events-none opacity-40"
                          : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            <p className="text-xs text-muted-foreground/70">
              {isEn
                ? "Press Esc to clear · Enter to open the top result"
                : "Esc zum Löschen · Eingabe öffnet das erste Ergebnis"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
