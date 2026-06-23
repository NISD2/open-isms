import { Link } from "@/i18n/navigation";
import { VIEW_LABELS, type View } from "./views";

const ALL_VIEWS: View[] = ["path", "ceo", "ciso", "auditor", "msp", "advanced"];

/**
 * Tab-like switcher between views. URL-driven — selecting a view sets
 * ?view=<key>. Default inferred when ?view is absent (see defaultViewFor).
 *
 * v1: all views visible to all logged-in users. Hard role gate comes when
 * user.functionalRoles[] taxonomy lands (T-2 in v4.1 spec).
 */
export function ViewSwitcher({
  current,
  locale,
}: {
  current: View;
  locale: "en" | "de" | "nl";
}) {
  const labelKey = locale === "de" ? "de" : "en";
  return (
    <nav className="flex flex-wrap gap-1 border-b">
      {ALL_VIEWS.map((view) => {
        const active = view === current;
        return (
          <Link
            key={view}
            href={{
              pathname: "/journey" as const,
              query: { view },
            }}
            className={`px-3 py-1.5 text-sm border-b-2 transition-colors ${
              active
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {VIEW_LABELS[view][labelKey]}
          </Link>
        );
      })}
    </nav>
  );
}
