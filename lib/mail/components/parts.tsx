/**
 * The pieces emails are made of. Each carries the exact inline styles the emails had before they
 * moved to React Email, so a paragraph reads the same in every client. Plain elements rather than
 * React Email's Text and Heading, whose built-in sizes and margins would change the look; Button
 * comes from React Email for its Outlook padding fixes.
 */
import { Button, Link } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";
import { BRAND } from "../layout";

interface Styled {
  readonly children: ReactNode;
  readonly style?: CSSProperties;
}

/** The heading an email opens with. */
export function Title({ children, style }: Styled) {
  return (
    <h2 style={{ margin: "0 0 16px", color: BRAND.foreground, ...style }}>{children}</h2>
  );
}

/** Body text. Spacing differs from email to email, so it is passed in where it does. */
export function Para({ children, style }: Styled) {
  return (
    <p style={{ color: BRAND.foreground, lineHeight: 1.6, margin: "0 0 8px", ...style }}>
      {children}
    </p>
  );
}

/** The quiet line after the action: how long a link lasts, what to do if it was not you. */
export function Note({ children, style }: Styled) {
  return (
    <p
      style={{
        color: BRAND.mutedForeground,
        fontSize: "13px",
        margin: "24px 0 0",
        lineHeight: 1.5,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

/** The small print under a rule at the end of a mail to someone without an account. */
export function SmallPrint({ children, style }: Styled) {
  return (
    <p
      style={{
        color: BRAND.mutedForeground,
        fontSize: "12px",
        margin: "32px 0 0",
        lineHeight: 1.5,
        borderTop: `1px solid ${BRAND.border}`,
        paddingTop: "16px",
        ...style,
      }}
    >
      {children}
    </p>
  );
}

/** The one action an email asks for. */
export function CtaButton({ href, children, style }: Styled & { readonly href: string }) {
  return (
    <Button
      href={href}
      style={{
        display: "inline-block",
        background: BRAND.primary,
        color: "#fff",
        padding: "12px 24px",
        borderRadius: "6px",
        textDecoration: "none",
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </Button>
  );
}

/** A link inside text, in the link colour. */
export function InlineLink({
  href,
  children,
  style,
}: Styled & { readonly href: string }) {
  return (
    <Link
      href={href}
      style={{ color: BRAND.primary, textDecoration: "underline", ...style }}
    >
      {children}
    </Link>
  );
}

/** A quiet link, for opt-outs and "view in browser". */
export function MutedLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{ color: BRAND.mutedForeground, textDecoration: "underline" }}
    >
      {children}
    </Link>
  );
}

/** A sign-in or reset code, large and spaced so it reads off the screen. */
export function CodeBlock({ code }: { readonly code: string }) {
  return (
    <div
      style={{
        margin: "24px 0",
        padding: "20px",
        background: BRAND.muted,
        border: `1px solid ${BRAND.border}`,
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'SF Mono', Monaco, Consolas, monospace",
          fontSize: "32px",
          fontWeight: 700,
          letterSpacing: "0.25em",
          color: BRAND.foreground,
        }}
      >
        {code}
      </div>
    </div>
  );
}

/** Label and value pairs for the operator mails. */
export function FactRows({
  rows,
}: {
  readonly rows: readonly (readonly [string, string])[];
}) {
  return (
    <table
      style={{
        color: BRAND.foreground,
        lineHeight: 1.8,
        fontSize: "14px",
        margin: "0 0 24px",
      }}
    >
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td style={{ paddingRight: "16px", fontWeight: 600 }}>{label}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
