"use client";

import { Link } from "@/i18n/navigation";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StartJourneyCtaProps {
  locale: string;
}

export function StartJourneyCta({ locale }: StartJourneyCtaProps) {
  const de = locale === "de";

  return (
    <Card className="border-primary/40 bg-primary/5 duration-500 motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-2">
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          {de ? "Schritt 1 Ihrer Umsetzung" : "Step 1 of your journey"}
        </p>
        <CardTitle className="flex items-center gap-2 text-base">
          <Compass className="size-4 text-primary" />
          {de
            ? "Sie verstehen NIS2. Jetzt setzen Sie es um."
            : "You understand NIS2. Now put it into practice."}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {de
            ? "Ihr nächster Schritt: Organisation einrichten und mit der Umsetzung beginnen. Dauert etwa 2 Minuten."
            : "Your next step: set up your organization and begin. About 2 minutes."}
        </p>
        <Button asChild className="gap-2">
          <Link href="/onboarding" target="_blank" rel="noopener noreferrer">
            {de ? "Organisation einrichten" : "Set up your organization"}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
