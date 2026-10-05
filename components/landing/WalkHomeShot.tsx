import { getLocale, getTranslations } from "next-intl/server";
import { restSizes, shotImage, zoomSizes } from "@/components/landing/shots";
import { AutoShot } from "@/components/landing/ZoomShot";

/** The shot's width on a large screen: the 72rem column less the 25rem pitch and gap. */
const SHOT_PX = 704;

/**
 * The walk's home, zooming into the path with its first steps done, then on to the next three.
 * Five rounds, then it rests whole (Simon, 04.10.2026). The landing hero shows it, and so does the
 * ask on pages whose reader never saw the landing page.
 */
export async function WalkHomeShot({ preload = false }: { readonly preload?: boolean }) {
  const t = await getTranslations("landing.walk");
  const locale = await getLocale();
  return (
    <div
      className="rounded-xl"
      style={{ boxShadow: "0 40px 80px -20px rgb(40 75 99 / 0.28)" }}
    >
      <AutoShot
        image={shotImage("path", locale, t("heroAlt"))}
        sizes={zoomSizes("path", SHOT_PX)}
        restSizes={restSizes(SHOT_PX)}
        rounds={5}
        preload={preload}
        className="rounded-xl border border-border/60"
      />
    </div>
  );
}
