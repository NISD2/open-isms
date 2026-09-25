import { getTranslations } from "next-intl/server";
import { stepKey } from "@/lib/compliance/durchgang";

/**
 * What the implementation spec knows about a step and the guidance beside it
 * does not: who does the work and who decides, the one question to ask the
 * team, and what is usually missed. Drafted from the spec and checked against
 * the statute text; the guidance already says what the item asks for, so
 * nothing here repeats it.
 */
export async function StepNotes({ code }: { code: string }) {
  const t = await getTranslations("durchgang");
  const key = `steps.${stepKey(code)}`;
  if (!t.has(`${key}.who`)) return null;

  const raw: unknown = t.raw(`${key}.missed`);
  const missed = Array.isArray(raw)
    ? raw.filter((line): line is string => typeof line === "string")
    : [];

  return (
    <section data-testid="durchgang-step-notes" className="space-y-4 text-sm">
      <Note heading={t("who")}>
        <p className="leading-relaxed">{t(`${key}.who`)}</p>
      </Note>
      <Note heading={t("ask")}>
        <p className="leading-relaxed italic">{t(`${key}.ask`)}</p>
      </Note>
      {missed.length > 0 && (
        <Note heading={t("missed")}>
          <ul className="list-disc space-y-1.5 pl-4 text-muted-foreground marker:text-muted-foreground/60">
            {missed.map((line) => (
              <li key={line} className="leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
        </Note>
      )}
    </section>
  );
}

function Note({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {heading}
      </h3>
      {children}
    </div>
  );
}
