import { getTranslations } from "next-intl/server";
import { SignInLink } from "@/components/auth/SignInLink";
import { Art } from "@/components/durchgang/Art";
import { MotionProvider } from "@/components/landing/motion";
import { WalkHomeShot } from "@/components/landing/WalkHomeShot";
import { ApprovalLink, TalkFirst } from "@/components/pricing/PaidPricingCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The head of a wiki page that answers one search: the search in the H1, the plain answer under it,
 * then the homepage hero's two ways forward and a page for whoever decides. On a phone these fit
 * the first screen, so the picture of the page's one object shows from the small breakpoint up.
 *
 * With `shot` it opens like the homepage instead: the app itself, moving, beside the text on a
 * large screen and under the buttons on a phone. For the pages a search ad lands on.
 */
export async function WikiAnswerHeader({
  badge,
  title,
  answer,
  ...picture
}: {
  badge: string;
  title: string;
  answer: string;
} & (
  | {
      /** A picture of the page's one object, under `public/`. */
      art: string;
      shot?: never;
    }
  | { shot: true; art?: never }
)) {
  const t = await getTranslations("landing");
  return (
    <header
      className={
        picture.shot
          ? "grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start"
          : "flex items-start gap-10"
      }
    >
      <div className="min-w-0 flex-1">
        <Badge variant="secondary" className="mb-3">
          {badge}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-balance">{title}</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {answer}
        </p>
        <div
          className={cn(
            "mt-6 flex flex-col items-start gap-3 print:hidden",
            // Beside the shot the column is too narrow for both: they stack, as on the homepage.
            !picture.shot && "sm:flex-row sm:items-center",
          )}
        >
          <Button
            asChild
            size="lg"
            className="h-11 rounded-lg px-5 text-[0.9375rem] font-medium shadow-sm transition-shadow hover:shadow-md"
          >
            <SignInLink query={{ mode: "register" }}>{t("guided.cta")}</SignInLink>
          </Button>
          <TalkFirst size="button" />
        </div>
        <div className="mt-3 print:hidden">
          <ApprovalLink />
        </div>
      </div>
      {picture.shot ? (
        <div className="print:hidden">
          <MotionProvider>
            <WalkHomeShot preload />
          </MotionProvider>
        </div>
      ) : (
        <div
          aria-hidden
          className="hidden w-44 shrink-0 justify-center pt-8 sm:flex lg:w-48"
        >
          <Art src={picture.art} className="h-auto w-full" />
        </div>
      )}
    </header>
  );
}
