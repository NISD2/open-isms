import { NIS2_WALK } from "@/lib/durchgang";
import { approvalMetadata, WalkApproval } from "../../_walk/pages";

export const generateMetadata = approvalMetadata;

export default function Nis2WalkApproval() {
  return <WalkApproval walk={NIS2_WALK} />;
}
