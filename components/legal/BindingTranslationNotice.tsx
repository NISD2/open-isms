/**
 * The line above a contract read in translation: the page is for information, the English text
 * binds, and here it is. Renders nothing for a reader of a binding language. Without "use client"
 * on purpose, so the legal pages render it on the server and the order form on the client.
 */
import { useLocale, useTranslations } from "next-intl";
import { isContractTranslationLocale } from "@/lib/legal/contract-language";

export function BindingTranslationNotice({
  englishHref,
  terms = false,
  className = "",
}: {
  /** The same document in English, the binding text. */
  readonly englishHref: string;
  /**
   * The terms of service and the order they govern: those say themselves which version binds
   * (clause C2: German and English, the German prevails), so the line repeats that instead.
   */
  readonly terms?: boolean;
  readonly className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("billing");
  if (!isContractTranslationLocale(locale)) return null;
  return (
    <p
      className={`rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 text-sm leading-relaxed dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 ${className}`}
    >
      {t.rich(terms ? "translationNoticeTerms" : "translationNotice", {
        english: (chunks) => (
          <a
            href={englishHref}
            hrefLang="en"
            className="font-medium underline underline-offset-4"
          >
            {chunks}
          </a>
        ),
      })}
    </p>
  );
}
