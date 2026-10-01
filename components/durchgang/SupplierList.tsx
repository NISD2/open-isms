"use client";

import { ExternalLink, Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import type { Registers } from "./view";

const EMPTY = { name: "", what: "" };

/**
 * 5.1: the supplier register as a person jots it down, one line per supplier with what they do
 * for you (`supplier.name`, `supplier.description`). Contracts, contacts and the rest stay on the
 * supplier page.
 */
export function SupplierList({ initial }: { initial: Registers["supplier"] }) {
  const t = useTranslations("durchgang.ui.suppliers");
  const utils = trpc.useUtils();
  const { data = initial } = trpc.supplier.list.useQuery(undefined, {
    initialData: initial,
  });
  const create = trpc.supplier.create.useMutation({
    onSuccess: () => utils.supplier.list.invalidate(),
  });
  const [form, setForm] = useState(EMPTY);
  const name = form.name.trim();

  const add = () => {
    if (!name) return;
    create.mutate(
      { name, description: form.what.trim() || null },
      {
        onSuccess: () => setForm(EMPTY),
        onError: () => toast.error(t("failed")),
      },
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {data.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y">
          {data.map((row) => (
            <li key={row.id} className="px-5 py-3.5">
              <p className="text-sm font-medium">{row.name}</p>
              {row.description && (
                <p className="text-sm text-muted-foreground">{row.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="space-y-3 border-t bg-muted/30 px-5 py-5"
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="dg-supplier-name">{t("name")}</Label>
            <Input
              id="dg-supplier-name"
              value={form.name}
              maxLength={255}
              placeholder={t("namePlaceholder")}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dg-supplier-what">{t("what")}</Label>
            <Input
              id="dg-supplier-what"
              value={form.what}
              maxLength={500}
              placeholder={t("whatPlaceholder")}
              onChange={(e) => setForm({ ...form, what: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={!name || create.isPending}>
            {create.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            {t("add")}
          </Button>
        </div>
        <Link
          href="/suppliers"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          {t("details")}
          <ExternalLink className="size-3.5" />
        </Link>
      </form>
    </div>
  );
}
