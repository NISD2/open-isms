/**
 * Recipient Resolution — Determines who receives deadline notifications
 *
 * Uses a cascade to find the most specific assignee:
 * 1. Category owner (single owner per category)
 * 2. Company admins (fallback when no owner assigned)
 */
import { eq, and, inArray } from "drizzle-orm";
import { categoryAssignment, user } from "@/schema";
import type { Database } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecipientInfo {
  userId: string;
  name: string;
  email: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fetch user info for a set of user IDs, deduplicated. Single query. */
async function fetchUserInfo(
  db: Database,
  userIds: string[],
): Promise<RecipientInfo[]> {
  if (userIds.length === 0) return [];

  const unique = [...new Set(userIds)];
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(inArray(user.id, unique));

  return rows.map((r) => ({ userId: r.id, name: r.name, email: r.email }));
}

// ---------------------------------------------------------------------------
// resolveRecipients — cascade: category owner → company admins
// ---------------------------------------------------------------------------

export async function resolveRecipients(
  db: Database,
  opts: {
    assessmentId: string;
    categoryId: string;
    requirementId: string;
    companyId: string;
  },
): Promise<RecipientInfo[]> {
  // 1. Category owner
  const catAssignment = await db
    .select({ userId: categoryAssignment.userId })
    .from(categoryAssignment)
    .where(
      and(
        eq(categoryAssignment.assessmentId, opts.assessmentId),
        eq(categoryAssignment.categoryId, opts.categoryId),
      ),
    );

  if (catAssignment.length > 0) {
    return fetchUserInfo(
      db,
      catAssignment.map((r) => r.userId),
    );
  }

  // 2. Fallback: company admins
  return resolveManagement(db, opts.companyId);
}

// ---------------------------------------------------------------------------
// resolveManagement — company admins
// ---------------------------------------------------------------------------

export async function resolveManagement(
  db: Database,
  companyId: string,
): Promise<RecipientInfo[]> {
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(and(eq(user.companyId, companyId), eq(user.role, "admin")));

  return rows.map((r) => ({ userId: r.id, name: r.name, email: r.email }));
}

// ---------------------------------------------------------------------------
// resolveCategoryLead — category owner (used by escalation engine)
// ---------------------------------------------------------------------------

export async function resolveCategoryLead(
  db: Database,
  opts: {
    assessmentId: string;
    categoryId: string;
  },
): Promise<RecipientInfo[]> {
  const assignments = await db
    .select({ userId: categoryAssignment.userId })
    .from(categoryAssignment)
    .where(
      and(
        eq(categoryAssignment.assessmentId, opts.assessmentId),
        eq(categoryAssignment.categoryId, opts.categoryId),
      ),
    );

  if (assignments.length === 0) return [];

  return fetchUserInfo(
    db,
    assignments.map((r) => r.userId),
  );
}
