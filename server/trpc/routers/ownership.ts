/**
 * Handing a company to another member. The owner confirms with a fresh email code, the recipient
 * accepts while signed in as themselves within TRANSFER_DAYS, and either can call it off before
 * then. The rules live in lib/organization/ownership-transfer.ts.
 *
 * Every procedure is on the account tiers: who owns a company is account management, like billing,
 * and an account that has not ordered must be able to do it too.
 */
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { OtpRateLimitedError, requestOtp, verifyOtp } from "@/lib/auth/otp";
import type { DbOrTx } from "@/lib/db";
import { isLocaleCode } from "@/lib/locale";
import { sendAuthCode } from "@/lib/mail";
import { findMembershipRole } from "@/lib/organization/membership";
import {
  acceptRefusal,
  closeLapsedTransfers,
  makeOwner,
  mayCancel,
  transferExpiry,
} from "@/lib/organization/ownership-transfer";
import { rateLimit } from "@/lib/rate-limit";
import { company, ownershipTransfer, user } from "@/schema";
import { mailOwnershipNotice } from "../helpers/ownership-mail";
import { accountAdminProcedure, accountProcedure, router } from "../init";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Code mails per company and day: enough to retry, too few to mail-bomb the owner. */
const CODE_REQUESTS_PER_DAY = 5;

const companyOwnerId = async (db: DbOrTx, companyId: string): Promise<string | null> => {
  const row = await db.query.company.findFirst({
    where: eq(company.id, companyId),
    columns: { ownerId: true },
  });
  return row?.ownerId ?? null;
};

/** The owner of the open company, and nobody else. The owner is always an admin. */
const ownerProcedure = accountAdminProcedure.use(async ({ ctx, next }) => {
  if ((await companyOwnerId(ctx.db, ctx.companyId)) !== ctx.userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the owner of the organization can hand it over.",
    });
  }
  return next();
});

const fromUser = alias(user, "from_user");
const toUser = alias(user, "to_user");

/** The company's transfer by id, with the names for the mail. Null when it is another company's. */
const transferOf = (db: DbOrTx, input: { transferId: string; companyId: string }) =>
  db
    .select({
      id: ownershipTransfer.id,
      companyId: ownershipTransfer.companyId,
      fromUserId: ownershipTransfer.fromUserId,
      toUserId: ownershipTransfer.toUserId,
      status: ownershipTransfer.status,
      expiresAt: ownershipTransfer.expiresAt,
      fromName: fromUser.name,
      toName: toUser.name,
    })
    .from(ownershipTransfer)
    .leftJoin(fromUser, eq(fromUser.id, ownershipTransfer.fromUserId))
    .leftJoin(toUser, eq(toUser.id, ownershipTransfer.toUserId))
    .where(
      and(
        eq(ownershipTransfer.id, input.transferId),
        eq(ownershipTransfer.companyId, input.companyId),
      ),
    )
    .limit(1)
    .for("update", { of: ownershipTransfer })
    .then((rows) => rows[0] ?? null);

/** The company's open handover with both names, or null. A lapsed one is not open. */
const openTransferOf = (db: DbOrTx, companyId: string, now: Date) =>
  db
    .select({
      id: ownershipTransfer.id,
      fromUserId: ownershipTransfer.fromUserId,
      toUserId: ownershipTransfer.toUserId,
      fromName: fromUser.name,
      toName: toUser.name,
      expiresAt: ownershipTransfer.expiresAt,
    })
    .from(ownershipTransfer)
    .leftJoin(fromUser, eq(fromUser.id, ownershipTransfer.fromUserId))
    .leftJoin(toUser, eq(toUser.id, ownershipTransfer.toUserId))
    .where(
      and(
        eq(ownershipTransfer.companyId, companyId),
        eq(ownershipTransfer.status, "pending"),
        gt(ownershipTransfer.expiresAt, now),
      ),
    )
    .orderBy(desc(ownershipTransfer.createdAt))
    .limit(1)
    .then((rows) => rows[0] ?? null);

const REFUSED: Record<NonNullable<ReturnType<typeof acceptRefusal>>, string> = {
  not_open: "This handover is no longer open.",
  not_recipient: "This handover is addressed to someone else.",
  owner_changed: "The organization changed hands since this handover was asked for.",
  not_member: "You are no longer a member of this organization.",
};

export const ownershipRouter = router({
  /** The open company's owner and its open handover, if there is one. */
  state: accountProcedure.query(async ({ ctx }) => {
    const [ownerId, pending] = await Promise.all([
      companyOwnerId(ctx.db, ctx.companyId),
      openTransferOf(ctx.db, ctx.companyId, new Date()),
    ]);
    return { ownerId, pending };
  }),

  /** Mail the owner a code that confirms the handover. */
  requestCode: ownerProcedure
    .input(z.object({ locale: z.string().max(8).optional() }))
    .mutation(async ({ ctx, input }) => {
      if (
        !(await rateLimit(
          `ownership-code:${ctx.companyId}`,
          CODE_REQUESTS_PER_DAY,
          DAY_MS,
        ))
      ) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many codes today. Try again tomorrow.",
        });
      }
      const owner = await ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.userId),
        columns: { email: true },
      });
      if (!owner)
        throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });

      const issued = await requestOtp(owner.email, "ownership_transfer").catch((err) => {
        if (err instanceof OtpRateLimitedError) return null;
        throw err;
      });
      if (!issued) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "A code was just sent. Wait a few minutes before asking for another.",
        });
      }
      await sendAuthCode({
        to: owner.email,
        code: issued.code,
        locale: isLocaleCode(input.locale) ? input.locale : undefined,
        kind: "ownership-transfer",
      });
      return { sent: true };
    }),

  /**
   * Ask to hand the company to another member. The code proves the person at the keyboard holds
   * the owner's mailbox right now, not only a session that was left open.
   */
  start: ownerProcedure
    .input(
      z.object({
        toUserId: z.string().uuid(),
        /** Named `otp` so the automatic audit row scrubs it (isms-trpc AUDIT_REDACT_KEYS). */
        otp: z.string().trim().max(12),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.toUserId === ctx.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You already own it." });
      }
      if (
        !(await findMembershipRole(ctx.db, {
          userId: input.toUserId,
          companyId: ctx.companyId,
        }))
      ) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in your company.",
        });
      }
      // Asked before the code is spent, so a code is not used up on a request that cannot be made.
      if (await openTransferOf(ctx.db, ctx.companyId, new Date())) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A handover is already open. Withdraw it first.",
        });
      }
      const owner = await ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.userId),
        columns: { email: true },
      });
      if (!owner || !(await verifyOtp(owner.email, input.otp, "ownership_transfer"))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The code is wrong or has expired. Ask for a new one.",
        });
      }

      const now = new Date();
      const created = await ctx.db.transaction(async (tx) => {
        await closeLapsedTransfers(tx, { companyId: ctx.companyId, now });
        const [row] = await tx
          .insert(ownershipTransfer)
          .values({
            companyId: ctx.companyId,
            fromUserId: ctx.userId,
            toUserId: input.toUserId,
            initiatedBy: ctx.userId,
            method: "self_service",
            status: "pending",
            createdAt: now,
            expiresAt: transferExpiry(now),
          })
          .onConflictDoNothing()
          .returning({
            id: ownershipTransfer.id,
            expiresAt: ownershipTransfer.expiresAt,
          });
        return row ?? null;
      });
      if (!created) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A handover is already open. Withdraw it first.",
        });
      }

      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "ownership.transfer_requested",
        entityType: "ownership_transfer",
        entityId: created.id,
        description: `Ownership handover requested from ${ctx.userId} to ${input.toUserId}, confirmed by email code, open until ${created.expiresAt.toISOString()}`,
        newValue: {
          fromUserId: ctx.userId,
          toUserId: input.toUserId,
          method: "self_service",
          expiresAt: created.expiresAt.toISOString(),
        },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      mailOwnershipNotice({
        db: ctx.db,
        companyId: ctx.companyId,
        actorId: ctx.userId,
        kind: "requested",
        fromUserId: ctx.userId,
        toUserId: input.toUserId,
        expiresAt: created.expiresAt,
      });
      return { transferId: created.id };
    }),

  /** The recipient takes the company over. They must have it open, as themselves. */
  accept: accountProcedure
    .input(z.object({ transferId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const done = await ctx.db.transaction(async (tx) => {
        const transfer = await transferOf(tx, {
          transferId: input.transferId,
          companyId: ctx.companyId,
        });
        if (!transfer) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Handover not found." });
        }
        // Locks the company row, so two handovers cannot both read the same owner.
        const [current] = await tx
          .select({ ownerId: company.ownerId })
          .from(company)
          .where(eq(company.id, ctx.companyId))
          .for("update");
        const refusal = acceptRefusal(transfer, {
          userId: ctx.userId,
          now,
          currentOwnerId: current?.ownerId ?? null,
          recipientIsMember:
            (await findMembershipRole(tx, {
              userId: ctx.userId,
              companyId: ctx.companyId,
            })) !== null,
        });
        if (refusal) {
          throw new TRPCError({
            code: refusal === "not_recipient" ? "FORBIDDEN" : "BAD_REQUEST",
            message: REFUSED[refusal],
          });
        }
        await tx
          .update(ownershipTransfer)
          .set({ status: "accepted", decidedAt: now, decidedBy: ctx.userId })
          .where(eq(ownershipTransfer.id, transfer.id));
        await makeOwner(tx, { companyId: ctx.companyId, userId: ctx.userId });
        return transfer;
      });

      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "ownership.transfer_accepted",
        entityType: "ownership_transfer",
        entityId: done.id,
        description: `Ownership handed over from ${done.fromUserId ?? "nobody"} to ${ctx.userId}, accepted by the recipient`,
        previousValue: { ownerId: done.fromUserId },
        newValue: { ownerId: ctx.userId, method: "self_service" },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      mailOwnershipNotice({
        db: ctx.db,
        companyId: ctx.companyId,
        actorId: ctx.userId,
        kind: "accepted",
        fromUserId: done.fromUserId,
        toUserId: ctx.userId,
        expiresAt: null,
      });
      return { accepted: true };
    }),

  /** The owner withdraws the handover, or the recipient declines it. */
  cancel: accountProcedure
    .input(z.object({ transferId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const cancelled = await ctx.db.transaction(async (tx) => {
        const transfer = await transferOf(tx, {
          transferId: input.transferId,
          companyId: ctx.companyId,
        });
        if (!transfer || !mayCancel(transfer, ctx.userId, now)) return null;
        await tx
          .update(ownershipTransfer)
          .set({ status: "cancelled", decidedAt: now, decidedBy: ctx.userId })
          .where(eq(ownershipTransfer.id, transfer.id));
        return transfer;
      });
      if (!cancelled) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No open handover to call off.",
        });
      }
      await logAudit({
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "ownership.transfer_cancelled",
        entityType: "ownership_transfer",
        entityId: cancelled.id,
        description: `Ownership handover from ${cancelled.fromUserId ?? "nobody"} to ${cancelled.toUserId ?? "nobody"} ${ctx.userId === cancelled.toUserId ? "declined by the recipient" : "withdrawn by the owner"}`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return { cancelled: true };
    }),
});
