"use client";

import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { isBackupSystem } from "@/lib/asset-inventory/catalog-labels";
import { BACKUP_FREQUENCIES, recordDay } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { Backup } from "./draft";
import { Heading, Lead } from "./ExplainScreens";
import type { Of, WorkProps } from "./WorkScreens";

/** The catalogue item a company with no backup system on its list adds here. */
const BACKUP_SYSTEM = "infra-backup-system";

/**
 * 4.4: each backup system on the company's list, with how often it backs up and the day of its
 * last restore that worked. The answers are the asset's own columns, so the requirement page and
 * the asset page show the same. A company with none listed adds one in a tap.
 */
export function BackupsScreen({
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"backups"> }) {
  const utils = trpc.useUtils();
  const assets = trpc.asset.list.useQuery();
  const add = trpc.durchgang.addAssets.useMutation({
    onSuccess: () => utils.asset.list.invalidate(),
  });
  if (!assets.data) return null;
  const systems = assets.data.filter(isBackupSystem);
  const today = recordDay(new Date());

  const shown = (system: (typeof systems)[number]): Backup =>
    draft.backups[system.id] ?? {
      frequency: system.backupFrequency,
      lastRestore: system.lastBackupTestDate ?? "",
    };
  const set = (system: (typeof systems)[number], change: Partial<Backup>) =>
    onDraft({
      ...draft,
      backups: { ...draft.backups, [system.id]: { ...shown(system), ...change } },
    });

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      {systems.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-6">
          <p className="text-muted-foreground">{entry.copy.empty}</p>
          <button
            type="button"
            disabled={add.isPending}
            onClick={() => add.mutate({ catalogIds: [BACKUP_SYSTEM] })}
            className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:opacity-50"
          >
            <Plus className="size-4" />
            {entry.copy.add}
          </button>
        </div>
      ) : (
        <ul className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
          {systems.map((system) => {
            const value = shown(system);
            const dayId = `dg-backup-day-${system.id}`;
            return (
              <li key={system.id} className="space-y-4 px-5 py-5">
                <div>
                  <p className="font-medium break-words">{system.name}</p>
                  {system.description && system.description !== system.name && (
                    <p className="text-sm text-muted-foreground">{system.description}</p>
                  )}
                </div>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold">
                    {entry.copy.frequency}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {BACKUP_FREQUENCIES.map((f) => (
                      <button
                        key={f}
                        type="button"
                        aria-pressed={value.frequency === f}
                        onClick={() =>
                          set(system, { frequency: value.frequency === f ? null : f })
                        }
                        className={cn(
                          "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                          value.frequency === f
                            ? "border-primary bg-primary/[0.06] text-foreground"
                            : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        {entry.copy.options[f]}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="space-y-1.5">
                  <label htmlFor={dayId} className="text-sm font-semibold">
                    {entry.copy.lastRestore}
                  </label>
                  <Input
                    id={dayId}
                    type="date"
                    max={today}
                    className="max-w-48"
                    value={value.lastRestore}
                    onChange={(e) => set(system, { lastRestore: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {entry.copy.lastRestoreHint}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
