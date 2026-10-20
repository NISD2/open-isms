import { GDPR_WALK } from "@/lib/durchgang";
import { WalkItem, walkMetadata } from "../../_walk/pages";

export const generateMetadata = () => walkMetadata(GDPR_WALK);

export default async function GdprWalkItem({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const [{ code }, { s }] = await Promise.all([params, searchParams]);
  return <WalkItem walk={GDPR_WALK} code={code} screen={s} />;
}
