import { GDPR_WALK } from "@/lib/durchgang";
import { approvalMetadata, WalkApproval } from "../../_walk/pages";

export const generateMetadata = approvalMetadata;

export default function GdprWalkApproval() {
  return <WalkApproval walk={GDPR_WALK} />;
}
