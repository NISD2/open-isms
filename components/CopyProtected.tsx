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
