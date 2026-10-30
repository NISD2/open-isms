/**
 * The complete export's layout: sections, groups, field lists, register entries and tables, so
 * every part of the document (CompleteExport) is set the same way on screen and on paper.
 */
import { Fragment, type ReactNode } from "react";
import type { Row } from "@/lib/export/rows";

export function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-16 break-before-page print:mt-0">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {lead && <p className="mt-2 max-w-[68ch] text-sm text-muted-foreground">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** A record's fields that hold something, label beside value. */
export function Fields({ rows }: { rows: readonly Row[] }) {
  const filled = rows.flatMap(([label, value]) =>
    value === null ? [] : [{ label, value }],
  );
  if (filled.length === 0) return null;
  return (
    <dl className="mt-2 grid grid-cols-[minmax(9rem,13rem)_1fr] gap-x-4 gap-y-1 text-sm">
      {filled.map(({ label, value }) => (
        <Fragment key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/** One register row: its name, what it is, then its fields. */
export function Entry({
  title,
  lead,
  rows,
}: {
  title: string;
  lead?: string | null;
  rows: readonly Row[];
}) {
  return (
    <article className="break-inside-avoid border-b py-3 last:border-b-0">
      <h4 className="font-medium">{title}</h4>
      {lead && <p className="text-sm text-muted-foreground">{lead}</p>}
      <Fields rows={rows} />
    </article>
  );
}

export function Group({
  title,
  count,
  children,
}: {
  title: string;
  count: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-8 first:mt-0">
      <h3 className="flex items-baseline justify-between border-b-2 border-foreground/80 pb-1 text-base font-semibold">
        {title}
        <span className="text-xs font-normal text-muted-foreground">{count}</span>
      </h3>
      {children}
    </div>
  );
}

/** A table whose columns keep their widths from table to table, as `widths` sets them. */
export function Table({
  head,
  widths,
  rows,
}: {
  head: readonly string[];
  widths: readonly string[];
  rows: readonly ReactNode[][];
}) {
  return (
    <table className="w-full table-fixed border-collapse text-left text-sm">
      <thead>
        <tr className="border-b-2 border-foreground/80">
          {head.map((cell, i) => (
            <th key={cell} className={`py-1.5 pr-3 font-semibold ${widths[i] ?? ""}`}>
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are printed once, never reordered
          <tr key={i} className="break-inside-avoid border-b align-top">
            {row.map((cell, j) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: cells of a fixed column layout
              <td key={j} className="py-1.5 pr-3">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
