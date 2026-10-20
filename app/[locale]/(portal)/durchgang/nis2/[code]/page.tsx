import { NIS2_WALK } from "@/lib/durchgang";
import { WalkItem, walkMetadata } from "../../_walk/pages";

export const generateMetadata = () => walkMetadata(NIS2_WALK);

export default async function Nis2WalkItem({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const [{ code }, { s }] = await Promise.all([params, searchParams]);
  return <WalkItem walk={NIS2_WALK} code={code} screen={s} />;
}
