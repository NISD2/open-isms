"use client";

import { useState } from "react";
import { JourneyCard } from "./JourneyCard";
import type { JourneyItem, Queues } from "./views";

/**
 * Renders the queues with single-open accordion behaviour. State lives
 * here so opening one card across any queue closes whatever was open
 * before, regardless of which section it was in.
 */
export function QueueList({
  queues,
  emptyLabel,
}: {
  queues: Queues;
  emptyLabel: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {Object.entries(queues).map(([label, items]) => (
        <Section
          key={label}
          label={label}
          items={items}
          openId={openId}
          onToggle={(id) => setOpenId((curr) => (curr === id ? null : id))}
          emptyLabel={emptyLabel}
        />
      ))}
    </div>
  );
}

function Section({
  label,
  items,
  openId,
  onToggle,
  emptyLabel,
}: {
  label: string;
  items: JourneyItem[];
  openId: string | null;
  onToggle: (id: string) => void;
  emptyLabel: string;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h2>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="px-1 text-sm italic text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <JourneyCard
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => onToggle(item.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
