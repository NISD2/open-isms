"use client";

import {
  AlertTriangle,
  ClipboardList,
  FileText,
  GraduationCap,
  type LucideIcon,
  Server,
  Truck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExampleNote } from "./ExampleNote";
import { PageHeader } from "./PageHeader";

/** Each register: the message file its own page reads its title from, and its sign. */
const REGISTERS = {
  assets: { namespace: "assets", icon: Server },
  suppliers: { namespace: "suppliers", icon: Truck },
  risks: { namespace: "risks", icon: AlertTriangle },
  policies: { namespace: "policies", icon: FileText },
  training: { namespace: "training", icon: GraduationCap },
  managementReviews: { namespace: "managementReviews", icon: ClipboardList },
} as const satisfies Record<string, { namespace: string; icon: LucideIcon }>;

export type ExampleRegister = keyof typeof REGISTERS;

/** Message files are data: a table that does not parse shows no rows rather than breaking. */
const TABLE = z
  .object({
    text: z.string(),
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  })
  .catch({ text: "", columns: [], rows: [] });

/**
 * A register as a free account sees it (Simon, 04.10.2026: "A free user should be able to see
 * these pages but not actually use them"): the page's own title and explanation, then example rows
 * from a made-up company, marked as examples, with the way to order. Nothing is read or written.
 */
export function RegisterExamples({ register }: { register: ExampleRegister }) {
  const { namespace, icon: Icon } = REGISTERS[register];
  const t = useTranslations(namespace);
  const tx = useTranslations("portal.examples");
  const table = TABLE.parse(tx.raw(`registers.${register}`));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        icon={<Icon className="h-8 w-8 text-primary" />}
        title={t("title")}
        description={t("description")}
        helpText={t("helpText")}
      />
      <ExampleNote text={table.text} order />
      <Card className="mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              {table.columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((row) => (
              <TableRow key={row.join("|")} className="text-muted-foreground">
                {row.map((cell, i) => (
                  <TableCell
                    // biome-ignore lint/suspicious/noArrayIndexKey: cells of one example row have no id
                    key={i}
                    className={i === 0 ? "font-medium text-foreground" : undefined}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
