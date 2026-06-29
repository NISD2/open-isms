"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CheckCircle2, Lock } from "lucide-react";

interface CertificateDownloadProps {
  courseId: string;
  locale: string;
  allCompleted: boolean;
  completedCount: number;
  totalCount: number;
  userName: string | null;
}

export function CertificateDownload({
  courseId,
  locale,
  allCompleted,
  completedCount,
  totalCount,
  userName,
}: CertificateDownloadProps) {
  const remaining = totalCount - completedCount;

  if (!allCompleted) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="size-4 text-muted-foreground" />
            {locale === "de" ? "Teilnahmebescheinigung" : "Certificate of Completion"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {locale === "de"
              ? `Schließen Sie alle Lektionen ab, um Ihre Bescheinigung herunterzuladen. Noch ${remaining} von ${totalCount} Lektionen offen.`
              : `Complete all lessons to download your certificate. ${remaining} of ${totalCount} lessons remaining.`}
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  function handleDownload() {
    window.open(
      `/api/training/certificate?courseId=${courseId}&locale=${locale}`,
      "_blank",
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="size-4 text-primary" />
          {locale === "de" ? "Kurs abgeschlossen" : "Course Complete"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {locale === "de"
            ? `${userName ?? "Sie haben"} alle ${totalCount} Lektionen abgeschlossen. Laden Sie Ihre Teilnahmebescheinigung herunter.`
            : `${userName ?? "You"} completed all ${totalCount} lessons. Download your certificate below.`}
        </p>
        <Button onClick={handleDownload} className="gap-2">
          <Download className="size-4" />
          {locale === "de"
            ? "Bescheinigung herunterladen"
            : "Download Certificate"}
        </Button>
        <p className="text-xs text-muted-foreground">
          {locale === "de"
            ? "Wird als PDF heruntergeladen. Sie können die Datei speichern oder ausdrucken."
            : "Downloads as a PDF you can save or print."}
        </p>
      </CardContent>
    </Card>
  );
}
