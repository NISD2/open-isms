"use client";

/**
 * Personal dev tools — levers that act on the signed-in operator's own
 * account rather than on the platform.
 *
 * Every other tab here reports across companies. This one is the opposite: a
 * place for the small self-service resets that otherwise mean opening a SQL
 * client or a fresh browser profile.
 *
 * Security, because this repo is public and every endpoint below is readable:
 * the procedures take no entity id. Each one is pinned to ctx.userId on the
 * server, so an operator can only ever act on their own account, and the
 * platform-admin gate decides who reaches them at all. Nothing here deletes
 * compliance evidence.
 */
import { useState } from "react";
import { RotateCcw, Check, Loader2, Languages, GraduationCap, Compass, FileDown } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

/** next-intl writes the chosen locale here; clearing it restores detection. */
const LOCALE_COOKIE = "NEXT_LOCALE";

function Stamp({ value }: { value: Date | string | null }) {
  if (!value) return <span className="text-muted-foreground">never</span>;
  return <span className="tabular-nums">{new Date(value).toLocaleString()}</span>;
}

function Armed({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex items-center gap-1.5 text-green-700 dark:text-green-400">
      <Check className="h-3.5 w-3.5" /> armed
    </span>
  ) : (
    <span className="text-muted-foreground">not armed</span>
  );
}

export function DevPanel() {
  const state = trpc.platformAdmin.myDevState.useQuery();
  const data = state.data;
  // The only destructive action on the tab, so it asks twice rather than
  // dropping real course history on a stray click.
  const [confirmReset, setConfirmReset] = useState<string | null>(null);

  const arm = trpc.platformAdmin.armOnboardingSurface.useMutation({
    onSuccess: async ({ surface }) => {
      await state.refetch();
      toast.success(
        surface === "tour"
          ? "Tour armed. Open the journey to see it."
          : "Offer of help armed. Open any portal page to see it.",
      );
    },
    onError: () => toast.error("Could not arm that surface."),
  });

  // The setter half is the admin panel's existing per-user procedure, pointed
  // at my own id. Same audit trail, same conflict handling, no second copy.
  const completeCourse = trpc.platformAdmin.trainingMarkCourseComplete.useMutation({
    onSuccess: async ({ courseId, lessonCount }) => {
      await state.refetch();
      toast.success(`${courseId}: ${lessonCount} lesson(s) marked complete.`);
    },
    onError: () => toast.error("Could not complete that course."),
  });

  const resetCourse = trpc.platformAdmin.resetMyCourseProgress.useMutation({
    onSuccess: async ({ courseId, removed }) => {
      await state.refetch();
      toast.success(`${courseId}: ${removed} lesson row(s) cleared.`);
    },
    onError: () => toast.error("Could not reset that course."),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Compass className="h-4 w-4" /> Onboarding surfaces
          </CardTitle>
          <CardDescription>
            The tour arms on a first login, the offer of help on a second, so
            only one of them can be armed at a time. Arming either moves your
            login counter and disarms the other.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted-foreground">Login count</dt>
            <dd className="tabular-nums">{data ? data.loginCount : "…"}</dd>
            <dt className="text-muted-foreground">Tour</dt>
            <dd>
              {data ? (
                <>
                  <Armed on={data.hints.tour} /> · dismissed{" "}
                  <Stamp value={data.tourDismissedAt} />
                </>
              ) : "…"}
            </dd>
            <dt className="text-muted-foreground">Offer of help</dt>
            <dd>
              {data ? (
                <>
                  <Armed on={data.hints.helpOffer} /> · dismissed{" "}
                  <Stamp value={data.helpOfferDismissedAt} />
                </>
              ) : "…"}
            </dd>
          </dl>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button" variant="outline" size="sm"
              data-testid="arm-tour"
              disabled={arm.isPending}
              onClick={() => arm.mutate({ surface: "tour" })}
            >
              {arm.isPending && arm.variables?.surface === "tour"
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RotateCcw className="h-4 w-4" />}
              Arm the walkthrough
            </Button>
            <Button
              type="button" variant="outline" size="sm"
              data-testid="arm-help-offer"
              disabled={arm.isPending}
              onClick={() => arm.mutate({ surface: "helpOffer" })}
            >
              {arm.isPending && arm.variables?.surface === "helpOffer"
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RotateCcw className="h-4 w-4" />}
              Arm the second-login offer
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Takes effect on the next portal page load. No sign-out needed.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4" /> Course progress
          </CardTitle>
          <CardDescription>
            Complete marks every lesson done so the certificate PDF becomes
            reachable; reset clears your rows so the course can be walked
            again. Both act on your account only, and both leave the company
            training record alone: that is the § 38 BSIG evidence, not a
            replay flag.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {(data?.courses ?? []).map(({ courseId, lessons }) => (
              <li key={courseId} className="flex flex-wrap items-center gap-3 py-2 first:pt-0 last:pb-0">
                <span className="font-mono text-xs">{courseId}</span>
                <span className="ml-auto text-muted-foreground tabular-nums">
                  {lessons} lesson row(s)
                </span>
                <Button
                  type="button" variant="outline" size="sm"
                  disabled={!data || completeCourse.isPending}
                  onClick={() =>
                    data && completeCourse.mutate({ userId: data.userId, courseId })
                  }
                >
                  Complete
                </Button>
                <Button
                  type="button"
                  variant={confirmReset === courseId ? "destructive" : "ghost"}
                  size="sm"
                  disabled={lessons === 0 || resetCourse.isPending}
                  onClick={() => {
                    if (confirmReset === courseId) {
                      resetCourse.mutate({ courseId });
                      setConfirmReset(null);
                    } else {
                      setConfirmReset(courseId);
                    }
                  }}
                >
                  {confirmReset === courseId ? "Delete progress?" : "Reset"}
                </Button>
                <Button asChild type="button" variant="ghost" size="sm" disabled={lessons === 0}>
                  <a
                    href={`/api/training/certificate?courseId=${courseId}&locale=de`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileDown className="h-4 w-4" /> PDF
                  </a>
                </Button>
              </li>
            ))}
            {!data && <li className="py-2 text-muted-foreground">…</li>}
          </ul>
        </CardContent>
      </Card>

      <LanguageCard />
    </div>
  );
}

/**
 * Locale lives in a cookie rather than the database, so this one is a client
 * action: drop the cookie and let detection run again on the next request.
 */
function LanguageCard() {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);

  const current =
    typeof document !== "undefined"
      ? (document.cookie.split("; ").find((c) => c.startsWith(`${LOCALE_COOKIE}=`))?.split("=")[1] ?? null)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Languages className="h-4 w-4" /> Language preference
        </CardTitle>
        <CardDescription>
          Your locale is a cookie, not a column. Clearing it makes the site
          detect a language from the browser again, which is what a first-time
          visitor gets.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {LOCALE_COOKIE}:{" "}
          {cleared ? (
            <span className="text-muted-foreground">cleared</span>
          ) : (
            <span className="font-mono">{current ?? "not set"}</span>
          )}
        </span>
        <Button
          type="button" variant="outline" size="sm"
          data-testid="reset-locale"
          onClick={() => {
            document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
            setCleared(true);
            toast.success("Locale cookie cleared.");
            router.refresh();
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Clear locale cookie
        </Button>
      </CardContent>
    </Card>
  );
}
