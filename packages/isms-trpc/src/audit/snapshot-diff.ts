import type { SignOffSnapshotData } from "@nisd2/isms-schema/tables/sign-off-history";

export interface DiffEntry {
  path: string;
  type: "added" | "removed" | "changed";
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Compute a flat list of leaf-level differences between two sign-off snapshots.
 * Arrays are diffed by index. Objects are diffed by key.
 */
export function diffSnapshots(
  prev: SignOffSnapshotData,
  curr: SignOffSnapshotData,
): DiffEntry[] {
  const entries: DiffEntry[] = [];
  diffValues(prev, curr, "", entries);
  return entries;
}

function diffValues(
  a: unknown,
  b: unknown,
  path: string,
  entries: DiffEntry[],
): void {
  if (a === b) return;

  if (a === null || a === undefined) {
    if (b !== null && b !== undefined) {
      entries.push({ path, type: "added", newValue: b });
    }
    return;
  }

  if (b === null || b === undefined) {
    entries.push({ path, type: "removed", oldValue: a });
    return;
  }

  const aType = typeof a;
  const bType = typeof b;

  if (aType !== bType) {
    entries.push({ path, type: "changed", oldValue: a, newValue: b });
    return;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      const itemPath = `${path}[${i}]`;
      if (i >= a.length) {
        entries.push({ path: itemPath, type: "added", newValue: b[i] });
      } else if (i >= b.length) {
        entries.push({ path: itemPath, type: "removed", oldValue: a[i] });
      } else {
        diffValues(a[i], b[i], itemPath, entries);
      }
    }
    return;
  }

  if (aType === "object" && a !== null && b !== null) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
    for (const key of allKeys) {
      const childPath = path ? `${path}.${key}` : key;
      if (!(key in aObj)) {
        entries.push({ path: childPath, type: "added", newValue: bObj[key] });
      } else if (!(key in bObj)) {
        entries.push({ path: childPath, type: "removed", oldValue: aObj[key] });
      } else {
        diffValues(aObj[key], bObj[key], childPath, entries);
      }
    }
    return;
  }

  if (a !== b) {
    entries.push({ path, type: "changed", oldValue: a, newValue: b });
  }
}
