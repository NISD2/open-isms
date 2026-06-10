import { api } from "@/lib/trpc/server";
import { RisksPage } from "@/components/risks/RisksPage";

export default async function RisksRoute() {
  const [risks, assets] = await Promise.all([
    api.risk.list(),
    api.asset.list(),
  ]);
  return <RisksPage items={risks as Record<string, unknown>[]} assets={assets as Record<string, unknown>[]} />;
}
