import "@/lib/server-guard";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { OFFER_PATH } from "@/lib/billing/access";
import {
  createCallerFactory,
  createTRPCContext,
  MustOrderFirstError,
} from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";

const createCaller = createCallerFactory(appRouter);

/**
 * Wraps every procedure on the caller so the access gate's refusal becomes the redirect to the
 * offer that the portal layout makes for the same request. Next.js renders a page alongside its
 * layout, so a gated page still ran for an account that must order first and failed, logging the
 * error, although the layout's redirect meant nobody ever saw it. A redirect is not an error.
 */
const sendUnpaidToOffer = <T extends object>(node: T): T =>
  new Proxy(node, {
    get(target, key, receiver) {
      const child: unknown = Reflect.get(target, key, receiver);
      return typeof child === "function" ? sendUnpaidToOffer(child) : child;
    },
    async apply(target, self, args) {
      try {
        return await Reflect.apply(target as (...args: unknown[]) => unknown, self, args);
      } catch (error) {
        if (error instanceof MustOrderFirstError) {
          redirect({ href: OFFER_PATH, locale: await getLocale() });
        }
        throw error;
      }
    },
  });

/**
 * Server-side tRPC caller for use in Server Components.
 * Lazy-evaluated to handle the async context creation.
 */
export const api = sendUnpaidToOffer(createCaller(createTRPCContext));
