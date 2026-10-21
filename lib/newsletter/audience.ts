import { and, eq, isNotNull, sql } from "drizzle-orm";
import { billingAccount, company, companyMembership, user } from "@/schema";

/**
 * Who a newsletter may reach: people who have not opted out, whose address is real and verified,
 * and who are not part of a paying customer. The newsletter sells, and on 12.10 and 15.10.2026 it
 * told four people at a company that had already ordered to place their order and that the early
 * price was closing. Customers get product and billing mail, which are other email types.
 *
 * "Part of a customer" is anyone in a company on a full account, not only the person who pays.
 * An account that cancelled inside the thirty days is no longer full, so it is a prospect again.
 * It applies to a send to a group as well, so a group never overrides it.
 */
export const newsletterAudience = and(
  eq(user.emailFollowupsDisabled, false),
  eq(user.isDisposableEmail, false),
  isNotNull(user.emailVerifiedAt),
  sql`not exists (
    select 1 from ${companyMembership}
    inner join ${company} on ${company.id} = ${companyMembership.companyId}
    inner join ${billingAccount} on ${billingAccount.id} = ${company.billingAccountId}
    where ${companyMembership.userId} = ${user.id} and ${billingAccount.accessLevel} = 'full'
  )`,
);
