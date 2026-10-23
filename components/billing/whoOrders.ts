import { getTranslations } from "next-intl/server";
import type { RouterOutputs } from "@/lib/trpc/client";

type Status = Pick<
  RouterOutputs["billing"]["status"],
  "accessLevel" | "invoiced" | "payerName"
>;

/**
 * Who can order when the person reading cannot (`orderRightFor`), so a page without the order
 * button says whom to ask instead of ending there. While nobody has paid for the account any admin
 * orders; after that, its payer.
 */
export async function whoOrders(status: Status): Promise<string> {
  const t = await getTranslations("billing.payer");
  if (status.accessLevel !== "full" && !status.invoiced) return t("askAdmin");
  return status.payerName ? t("named", { name: status.payerName }) : t("unnamed");
}
