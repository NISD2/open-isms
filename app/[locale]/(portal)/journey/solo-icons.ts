import {
  Activity,
  BellRing,
  Boxes,
  Bug,
  CalendarCheck,
  ChartColumn,
  ClipboardCheck,
  ClipboardList,
  CloudLightning,
  Code,
  Compass,
  DatabaseBackup,
  Eye,
  FileCheck,
  FileLock,
  Fingerprint,
  Fish,
  FlaskConical,
  Gauge,
  Gavel,
  GitBranch,
  GraduationCap,
  Handshake,
  KeyRound,
  Landmark,
  LifeBuoy,
  Lightbulb,
  Lock,
  LockKeyhole,
  type LucideIcon,
  Megaphone,
  Presentation,
  RadioTower,
  RefreshCw,
  Scale,
  ScanSearch,
  ScrollText,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Siren,
  Stamp,
  Swords,
  TrendingUp,
  TriangleAlert,
  Truck,
  UserCheck,
  UserCog,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { FlowNode } from "./path-nodes";

/**
 * One icon per requirement, not per category.
 *
 * A long path is navigated by recognition — you learn where the backup step
 * and the phishing step sit and stop re-reading captions to find them — and
 * that only works if neighbours differ. Keyed by the requirement code so it
 * survives retitling and translation.
 */
const REQUIREMENT_ICON: Record<string, LucideIcon> = {
  // Registration
  "12.1": ScanSearch,
  "12.2": Landmark,
  "12.3": RefreshCw,
  "12.4": FileCheck,
  // Governance
  "1.1": GraduationCap,
  "1.2": Users,
  "1.3": Wallet,
  "1.4": Gavel,
  // Risk management
  "2.1": Compass,
  "2.2": Boxes,
  "2.3": TriangleAlert,
  "2.4": Stamp,
  // Suppliers
  "5.1": Truck,
  "5.2": Handshake,
  "5.3": ClipboardList,
  "5.4": BellRing,
  // Cryptography
  "9.1": Lock,
  "9.2": FileLock,
  "9.3": KeyRound,
  // Access control
  "10.1": LockKeyhole,
  "10.2": UserCheck,
  "10.3": UserCog,
  "10.4": Eye,
  // Authentication
  "11.1": Fingerprint,
  "11.2": RadioTower,
  "11.3": ShieldCheck,
  // Patching and vulnerabilities
  "6.1": ShoppingCart,
  "6.2": Code,
  "6.3": Bug,
  "6.4": Wrench,
  "6.5": GitBranch,
  // Incident handling
  "3.1": Siren,
  "3.2": Activity,
  "3.3": Send,
  "3.4": Swords,
  "3.5": Megaphone,
  // Business continuity
  "4.1": ChartColumn,
  "4.2": LifeBuoy,
  "4.3": CloudLightning,
  "4.4": DatabaseBackup,
  "4.5": FlaskConical,
  // Training
  "8.1": ScrollText,
  "8.2": Lightbulb,
  "8.3": Presentation,
  "8.4": Fish,
  // Effectiveness
  "7.1": Gauge,
  "7.2": ClipboardCheck,
  "7.3": CalendarCheck,
  "7.4": TrendingUp,
};

/** Fallback for a requirement added to the framework without an icon here. */
const CATEGORY_ICON: Record<string, LucideIcon> = {
  GOV: Landmark,
  RSK: ShieldAlert,
  INC: Siren,
  BCP: LifeBuoy,
  SUP: Truck,
  PRO: Wrench,
  EFF: Gauge,
  TRN: GraduationCap,
  CRY: Lock,
  ACC: KeyRound,
  AUT: Fingerprint,
  REG: ClipboardCheck,
};

/**
 * The icon for a requirement node: its own where one is defined, otherwise its
 * category's, otherwise a neutral one so a node always renders something.
 */
export function iconFor(node: FlowNode): LucideIcon {
  return REQUIREMENT_ICON[node.code] ?? CATEGORY_ICON[node.categoryCode] ?? Scale;
}
