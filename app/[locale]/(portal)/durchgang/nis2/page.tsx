import { NIS2_WALK } from "@/lib/durchgang";
import { WalkHome, walkMetadata } from "../_walk/pages";

export const generateMetadata = () => walkMetadata(NIS2_WALK);

export default function Nis2WalkHome() {
  return <WalkHome walk={NIS2_WALK} />;
}
