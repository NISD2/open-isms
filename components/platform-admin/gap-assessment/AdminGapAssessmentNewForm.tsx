"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EntityType = "essential" | "important" | "kritis";

export function AdminGapAssessmentNewForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("important");
  const [employeeCount, setEmployeeCount] = useState("");

  const createMutation = trpc.platformAdmin.gapAssessmentCreateForCompany.useMutation({
    onSuccess: (data) => {
      toast.success("Assessment created");
      router.push(`/platform-admin/gap-assessment/${data.assessmentId}/fill` as never);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedCount = employeeCount ? Number(employeeCount) : undefined;
    createMutation.mutate({
      companyName: companyName.trim(),
      sector: sector.trim(),
      entityType,
      employeeCount:
        parsedCount && Number.isFinite(parsedCount) && parsedCount > 0
          ? parsedCount
          : undefined,
    });
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>New gap assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                maxLength={255}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                required
                maxLength={255}
                placeholder="e.g. Energy, Healthcare, Waste"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="entityType">Entity type</Label>
              <Select
                value={entityType}
                onValueChange={(v) => setEntityType(v as EntityType)}
              >
                <SelectTrigger id="entityType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="essential">Essential</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="kritis">KRITIS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="employeeCount">Employee count (optional)</Label>
              <Input
                id="employeeCount"
                type="number"
                min="1"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/platform-admin/gap-assessment" as never)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
