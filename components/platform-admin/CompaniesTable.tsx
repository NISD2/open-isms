"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { planBadge, timeAgo } from "./admin-format";

export interface CompanyRow {
  id: string;
  name: string;
  sector: string;
  entityType: string;
  plan: string;
  employeeCount: number | null;
  actsAsNis2Entity: boolean;
  actsAsSupplier: boolean;
  activatedAt: Date | null;
  createdAt: Date;
  userCount: number;
  compliancePct: string;
}

export function CompaniesTable({ companies }: { companies: CompanyRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">All Companies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Company</th>
                <th className="pb-2 pr-4 font-medium">Sector</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 font-medium">Users</th>
                <th className="pb-2 pr-4 font-medium">Compliance</th>
                <th className="pb-2 pr-4 font-medium">Flags</th>
                <th className="pb-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4 font-medium">{c.name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{c.sector}</td>
                  <td className="py-2 pr-4">{c.entityType}</td>
                  <td className="py-2 pr-4">{planBadge(c.plan)}</td>
                  <td className="py-2 pr-4">{c.userCount}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-1.5 rounded-full bg-green-500"
                          style={{
                            width: `${Math.min(100, Number.parseFloat(c.compliancePct))}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Number.parseFloat(c.compliancePct).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 space-x-1">
                    {!c.activatedAt && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        Draft
                      </span>
                    )}
                    {c.actsAsNis2Entity && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        NIS2
                      </span>
                    )}
                    {c.actsAsSupplier && (
                      <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-xs text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                        Supplier
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-muted-foreground">{timeAgo(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
