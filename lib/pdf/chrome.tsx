import { Text, View } from "@react-pdf/renderer";
import React from "react";
import { Logo } from "./brand";
import { styles } from "./styles";
import {
  BRAND,
  CALLOUT,
  type CalloutTone,
  ISSUER,
  PAGE,
  SIGNAL,
  STATUS,
  type StatusTone,
} from "./theme";

/**
 * Page furniture shared by every generated document.
 *
 * These are the pieces that make a compliance report, a certificate and a
 * supplier questionnaire recognisably the same product: the brand bands, the
 * header lockup, the stat plate, the section heading, the footer. A document
 * composes them and supplies its own content; it does not redraw them.
 */

/** Top and bottom brand rules. `fixed` so they repeat on every page. */
export function BrandBands() {
  return (
    <>
      <View style={styles.bandTop} fixed>
        <View style={styles.bandPrimary} />
        <View style={styles.bandAccent} />
      </View>
      <View style={styles.bandBottom} fixed>
        <View style={styles.bandAccent} />
        <View style={styles.bandPrimary} />
      </View>
    </>
  );
}

/**
 * Logo left, a labelled reference right. The reference is what a reader quotes
 * when they phone about the document, so it is set in the mono face and
 * repeated on every page that carries a header.
 */
export function DocHeader({ label, value }: { label?: string; value?: string }) {
  return (
    <>
      <View style={styles.header}>
        <Logo />
        {label && value ? (
          <View style={styles.headerMetaBlock}>
            <Text style={styles.headerMetaLabel}>{label}</Text>
            <Text style={styles.headerMetaValue}>{value}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.headerRule} />
    </>
  );
}

/**
 * Running footer. Context on the left, page count on the right.
 * `pageLabel` receives the live numbers from the layout engine.
 */
export function PageFooter({
  context,
  pageLabel = (n, total) => `${n} / ${total}`,
  inset = PAGE.marginX,
}: {
  context: string;
  pageLabel?: (page: number, total: number) => string;
  /** Text column the footer aligns to. Landscape sheets set their own. */
  inset?: number;
}) {
  return (
    <View style={[styles.pageFooter, { left: inset, right: inset }]} fixed>
      <Text>{context}</Text>
      <Text render={({ pageNumber, totalPages }) => pageLabel(pageNumber, totalPages)} />
    </View>
  );
}

export interface Stat {
  value: string;
  label: string;
  /** Optional emphasis for a count that is the point of the plate. */
  tone?: string;
}

/**
 * Bordered plate of divided cells. The one place a document states its numbers,
 * so a reader who reads nothing else still leaves with the headline.
 *
 * `centered` sizes the plate to its contents instead of the text column. Three
 * facts stretched across a landscape sheet look stranded; a report page with
 * five wants the full width.
 */
export function StatPlate({
  stats,
  centered = false,
}: {
  stats: Stat[];
  centered?: boolean;
}) {
  return (
    <View style={[styles.stats, centered ? styles.statsCentered : {}]}>
      {stats.map((stat, i) => (
        <React.Fragment key={stat.label}>
          {i > 0 && <View style={styles.statDivider} />}
          <View style={[styles.statCell, centered ? styles.statCellCentered : {}]}>
            <Text style={[styles.statValue, stat.tone ? { color: stat.tone } : {}]}>
              {stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

/**
 * Section heading: a short brand keyline, an optional code in the mono face,
 * the title, and a hairline under the lot. `wrap={false}` with
 * `minPresenceAhead` keeps a heading from stranding itself at the foot of a
 * page with nothing beneath it.
 */
export function SectionHeading({
  code,
  title,
  right,
}: {
  code?: string | null;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader} wrap={false} minPresenceAhead={40}>
      <View style={styles.sectionMark} />
      {code ? <Text style={styles.sectionCode}>{code}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

/** Label/value pair. The workhorse of the policy and annex documents. */
export function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

/** Tinted state label. Text carries the meaning so it survives greyscale. */
export function Badge({ tone, children }: { tone: StatusTone; children: string }) {
  const { bg, fg } = STATUS[tone];
  return (
    <Text style={[styles.badge, { backgroundColor: bg, color: fg }]}>{children}</Text>
  );
}

/** Set-off block for a warning, a caveat or reviewer feedback. */
export function Callout({
  tone,
  title,
  children,
}: {
  tone: CalloutTone;
  title?: string;
  children: string;
}) {
  const { bg, border, fg } = CALLOUT[tone];
  return (
    <View style={[styles.callout, { backgroundColor: bg, borderLeftColor: border }]}>
      {title ? <Text style={[styles.calloutTitle, { color: fg }]}>{title}</Text> : null}
      <Text style={[styles.calloutText, { color: fg }]}>{children}</Text>
    </View>
  );
}

export interface Column {
  header: string;
  /** Share of the row width, as a flex weight. */
  width: number;
  align?: "left" | "right" | "center";
  mono?: boolean;
}

/**
 * Ruled table. Rows never split mid-height, so a cell is never cut in two by a
 * page break. The head does not repeat across pages: `fixed` in react-pdf
 * repeats a node on every page of the Page, not on every page the table spans,
 * which would stamp the head of a short table over everything after it.
 */
export function Table({
  columns,
  rows,
}: {
  columns: Column[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <View>
      <View style={styles.tableHead}>
        {columns.map((col) => (
          <Text
            key={col.header}
            style={[styles.th, { flex: col.width, textAlign: col.align ?? "left" }]}
          >
            {col.header}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.tableRow} wrap={false}>
          {row.map((cellValue, ci) => {
            const col = columns[ci];
            const cellStyle = [
              col?.mono ? styles.tdMono : styles.td,
              { flex: col?.width ?? 1, textAlign: col?.align ?? ("left" as const) },
            ];
            return typeof cellValue === "string" ? (
              <Text key={ci} style={cellStyle}>
                {cellValue}
              </Text>
            ) : (
              <View key={ci} style={cellStyle}>
                {cellValue}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * Cover footer: who issued the document, what it does and does not claim, and
 * the seal. The disclaimer sits centre because on a cover the eye lands there
 * last, which is the right moment to read a caveat.
 */
export function CoverFooter({
  issuedByLabel,
  disclaimer,
  seal,
}: {
  issuedByLabel: string;
  disclaimer?: string;
  seal?: React.ReactNode;
}) {
  return (
    <View style={styles.coverFooter}>
      <View style={{ width: 190 }}>
        <Text style={styles.issuerLabel}>{issuedByLabel}</Text>
        <Text style={styles.issuerName}>{ISSUER.name}</Text>
        <Text style={styles.issuerUrl}>{ISSUER.url}</Text>
      </View>
      {disclaimer ? (
        <Text style={styles.disclaimer}>{disclaimer}</Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <View style={{ width: 190, alignItems: "flex-end" }}>{seal}</View>
    </View>
  );
}

/**
 * Cover block: eyebrow, title, subtitle, then a rule and a list of label/value
 * lines. Every document opens the same way, which is most of what makes the
 * set read as a family.
 */
export function CoverHeading({
  eyebrow,
  title,
  subtitle,
  meta = [],
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: { label: string; value: string }[];
}) {
  return (
    <>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.coverTitle}>{title}</Text>
      {subtitle ? <Text style={styles.coverSubtitle}>{subtitle}</Text> : null}
      {meta.length > 0 ? (
        <>
          <View style={styles.coverRule} />
          {meta.map((m) => (
            <View key={m.label} style={styles.coverMeta}>
              <Text style={styles.coverMetaLabel}>{m.label}</Text>
              <Text style={styles.coverMetaValue}>{m.value}</Text>
            </View>
          ))}
        </>
      ) : null}
    </>
  );
}

/** Score bands, coarsest first. Shared by the gap assessment and the report so
 *  a percentage means the same colour wherever it is drawn. */
export function scoreColor(percent: number): string {
  if (percent >= 90) return SIGNAL.strong;
  if (percent >= 75) return SIGNAL.good;
  if (percent >= 50) return SIGNAL.fair;
  if (percent >= 25) return SIGNAL.weak;
  return SIGNAL.poor;
}

export { BRAND, ISSUER };
