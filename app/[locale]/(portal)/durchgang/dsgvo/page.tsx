import { GDPR_WALK } from "@/lib/durchgang";
import { WalkHome, walkMetadata } from "../_walk/pages";

export const generateMetadata = () => walkMetadata(GDPR_WALK);

export default function GdprWalkHome() {
  return <WalkHome walk={GDPR_WALK} />;
}
