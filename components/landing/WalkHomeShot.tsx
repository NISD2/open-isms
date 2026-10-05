import { getLocale, getTranslations } from "next-intl/server";
import { HeroVideo } from "@/components/landing/HeroVideo";
import { restSizes, shotImage, zoomSizes } from "@/components/landing/shots";
import { AutoShot } from "@/components/landing/ZoomShot";

/** The shot's width on a large screen: the 72rem column less the 25rem pitch and gap. */
const SHOT_PX = 704;

/**
 * The walk's home, zooming into the path with its first steps done, then on to the next three.
 * Five rounds, then it rests whole (Simon, 04.10.2026). The landing hero shows it, and so does the
 * ask on pages whose reader never saw the landing page.
 */
export async function WalkHomeShot({
  preload = false,
  video = false,
}: {
  readonly preload?: boolean;
  /** The landing hero: the walk's video replaces the shot once it has loaded. */
  readonly video?: boolean;
}) {
  const t = await getTranslations("landing.walk");
  const locale = await getLocale();
  const shot = (
    <AutoShot
      image={shotImage("path", locale, t("heroAlt"))}
      sizes={zoomSizes("path", SHOT_PX)}
      restSizes={restSizes(SHOT_PX)}
      rounds={5}
      preload={preload}
      className="rounded-xl border border-border/60"
    />
  );
  // The walk exists in German and English only; every other locale sees the English cut.
  const cut = locale === "de" ? "de" : "en";
  return (
    <div
      className="rounded-xl"
      style={{ boxShadow: "0 40px 80px -20px rgb(40 75 99 / 0.28)" }}
    >
      {video ? <HeroVideo src={`/videos/walk-demo-${cut}.mp4`}>{shot}</HeroVideo> : shot}
    </div>
  );
}
