"use client";

export function CopyProtected({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="select-none"
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

/**
 * An island inside CopyProtected that can still be selected and copied.
 *
 * The wrapper cancels selection and copy across a whole article, which is the
 * point for prose and wrong for the few things a reader is meant to take away
 * with them: an address to write to, a statute reference, an IBAN. /hilfe was
 * the case that showed it -- the page exists to get people emailing, printed
 * the address, and would not let them copy it.
 *
 * user-select inherits, so select-text on a descendant overrides the
 * ancestor's select-none. The two handlers stop the events before they reach
 * the ancestor's, which cancels them.
 */
export function Copyable({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="select-text"
      onCopy={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {children}
    </span>
  );
}
