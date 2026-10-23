import { getTranslations } from "next-intl/server";
import type { RouterOutputs } from "@/lib/trpc/client";

type Status = Pick<
  RouterOutputs["billing"]["status"],
  "accessLevel" | "invoiced" | "payerName" | "sharedAccount"
>;

/**
 * Who can order when the person reading cannot (`orderRightFor`), so a page without the order
 * button says whom to ask instead of ending there. While nobody has paid for the account an admin
 * of all its organizations orders, so an admin of only some is sent to the holder; once paid, its
 * payer.
 */
export async function whoOrders(status: Status): Promise<string> {
  const t = await getTranslations("billing.payer");
  if (status.sharedAccount) {
    return status.payerName
      ? t("sharedNamed", { name: status.payerName })
      : t("sharedUnnamed");
  }
  if (status.accessLevel !== "full" && !status.invoiced) return t("askAdmin");
  return status.payerName ? t("named", { name: status.payerName }) : t("unnamed");
}
