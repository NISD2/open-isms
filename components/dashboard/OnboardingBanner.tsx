"use client";

import { Link } from "@/i18n/navigation";
import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";

export function OnboardingBanner() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Building2 className="h-8 w-8 text-primary" />}
        title="Welcome to NIS2 Compliance"
        description="Set up your organization to start your compliance journey"
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg">Create your organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            To start working on NIS2 compliance, you need to set up your company
            profile first. This takes about 2 minutes and includes your company
            details, sector classification, and entity type.
          </p>
          <Button asChild>
            <Link href="/onboarding">
              Set up organization
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
