import { Card, CardContent, CardHeader, CardTitle } from "@nisd2/isms-ui/components/card";

export interface LandingPageProps {
  title: string;
  tagline: string;
  ctaHref?: string;
  ctaLabel?: string;
}

/**
 * Shared landing page for OSS / SaaS ISMS apps.
 * Data (title, tagline, CTA) is passed in by the consumer's route file so
 * the same component can render different copy per deployment.
 */
export function LandingPage({ title, tagline, ctaHref, ctaLabel }: LandingPageProps) {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>{tagline}</p>
          {ctaHref && ctaLabel ? (
            <a
              href={ctaHref}
              className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {ctaLabel}
            </a>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
