/**
 * User access computation — single cached DB query per request.
 *
 * Every server component that needs to know "what can this user see/edit?"
 * calls getUserAccess(). React cache ensures one DB hit per request.
 */
import { cache } from "react";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categoryAssignment,
  requirementCategory,
  complianceFramework,
  requirement as requirementTable,
} from "@/schema";
import { hasReviewAccess } from "@/lib/auth";

// ============================================================================
// Cached category list — shared across layout, pages, and nav
// ============================================================================

export interface RequirementInfo {
  id: string;
  code: string;
  sortOrder: number;
}

export interface CategoryInfo {
  id: string;
  slug: string;
  code: string;
  sortOrder: number;
  estimatedMinutes: number | null;
  requirementCount: number;
  requirements: RequirementInfo[];
}

export interface FrameworkWithCategories {
  framework: {
    id: string;
    code: string;
    codePrefix: string | null;
    sidebarLabel: string | null;
  };
  categories: CategoryInfo[];
}

/** Cached per request — all active frameworks with their categories. */
export const getAllActiveCategories = cache(
  async (): Promise<Map<string, FrameworkWithCategories>> => {
    const frameworks = await db.query.complianceFramework.findMany({
      where: eq(complianceFramework.isActive, true),
      with: {
        categories: {
          orderBy: asc(requirementCategory.sortOrder),
          with: {
            requirements: {
              columns: { id: true, code: true, sortOrder: true },
              orderBy: asc(requirementTable.sortOrder),
            },
          },
        },
      },
    });

    const result = new Map<string, FrameworkWithCategories>();

    for (const fw of frameworks) {
      result.set(fw.code, {
        framework: {
          id: fw.id,
          code: fw.code,
          codePrefix: fw.codePrefix,
          sidebarLabel: fw.sidebarLabel,
        },
        categories: fw.categories.map((cat) => ({
          id: cat.id,
          slug: cat.slug,
          code: cat.code,
          sortOrder: cat.sortOrder,
          estimatedMinutes: cat.estimatedMinutes,
          requirementCount: cat.requirements.length,
          requirements: cat.requirements.map((r) => ({
            id: r.id,
            code: r.code,
            sortOrder: r.sortOrder,
          })),
        })),
      });
    }

    return result;
  },
);

// ============================================================================
// User access
// ============================================================================

export interface UserAccess {
  isAdmin: boolean;
  /** All category IDs the user owns */
  categoryIds: Set<string>;
}

/** Cached per request — safe to call from layout + page in the same render. */
export const getUserAccess = cache(
  async (
    assessmentId: string,
    userId: string,
    role: string,
  ): Promise<UserAccess> => {
    const isAdmin = hasReviewAccess(role);
    if (isAdmin) {
      return { isAdmin, categoryIds: new Set() };
    }

    const rows = await db.query.categoryAssignment.findMany({
      where: and(
        eq(categoryAssignment.assessmentId, assessmentId),
        eq(categoryAssignment.userId, userId),
      ),
      columns: { categoryId: true },
    });

    const categoryIds = new Set<string>();
    for (const row of rows) {
      categoryIds.add(row.categoryId);
    }

    return { isAdmin, categoryIds };
  },
);

// ============================================================================
// Pure predicates
// ============================================================================

/** Check if user can see a category */
export function canSeeCategory(
  access: UserAccess,
  categoryId: string,
): boolean {
  return access.isAdmin || access.categoryIds.has(categoryId);
}

/**
 * Get the set of visible requirement IDs for a category.
 * Returns null when ALL requirements are visible (admin or category owner).
 */
export function visibleRequirementIds(
  access: UserAccess,
  categoryId: string,
): Set<string> | null {
  if (access.isAdmin || access.categoryIds.has(categoryId)) return null;
  return new Set(); // not assigned = see nothing
}

/**
 * How many requirements the user can see in a category.
 * For admin/category owner: returns the total requirementCount.
 * For non-owners: returns 0.
 */
export function myRequirementCount(
  access: UserAccess,
  categoryId: string,
  totalRequirementCount: number,
): number {
  if (access.isAdmin || access.categoryIds.has(categoryId)) {
    return totalRequirementCount;
  }
  return 0;
}
