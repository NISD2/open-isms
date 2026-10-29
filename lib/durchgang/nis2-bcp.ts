import { item, MEASURES } from "./nis2-item";
import type { AnyItem } from "./types";

/**
 * The continuity items of the NIS 2 script (§ 30 Abs. 2 Nr. 3 BSIG): the plan for the business
 * with what must keep running and what it needs (4.2), and the backups with how long each needed
 * system takes back and the comparison (4.4). Data only, like the rest of the script.
 */
export const BCP_ITEMS: readonly AnyItem[] = [
  item({
    code: "4.2",
    category: "BCP",
    law: MEASURES,
    glossary: [],
    reviewed: "2026-10-28",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "fallback" },
      { kind: "critical", id: "keep" },
      { kind: "needs", id: "needs" },
      { kind: "policy", id: "plan", policy: "business_continuity" },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      crisisTeamLead:
        "In a company of this size the crisis is led by whoever leads in an emergency, asked in 3.1, and the plan names that person from there; asking again would let the two answers drift apart. No statute asks for a separate crisis lead. The requirement page keeps the field for a company that has one.",
      bcpActivationCriteria:
        "Conditions for activating the plan are CIR 2024/2690 Annex 4.1.2(d), which binds only the digital providers the CIR covers; no statute asks for them. The plan says in fixed words when it applies, and that the person who leads in an emergency decides in doubt.",
    },
  }),
  item({
    code: "4.4",
    category: "BCP",
    law: MEASURES,
    glossary: [],
    reviewed: "2026-10-28",
    screens: [
      { kind: "learn", id: "learn" },
      { kind: "compare", id: "copy" },
      { kind: "prepare", id: "ask" },
      { kind: "backups", id: "systems" },
      { kind: "restore", id: "restore" },
      { kind: "recovery", id: "recovery" },
      { kind: "done", id: "done" },
    ],
    notAsked: {
      backupFrequency:
        "Recorded per backup system on the company's list (asset.backup_frequency), where the requirement page keeps it too; a company with two backup systems has two answers.",
      lastBackupTest:
        "Recorded per backup system on the company's list (asset.last_backup_test_date): the last restore that worked from that system.",
      backupEncryption:
        "No statute asks for encrypted backups; CIR 2024/2690 Annex 4.2.2(d) asks the digital providers it covers for access controls to backup copies, and encryption belongs to § 30 Abs. 2 Nr. 8 BSIG, which 9.1 walks (its Konzept offers an encrypted-backup clause).",
      backupRestoreSuccessRate:
        "No primary source names a restore success rate; the walk records the date of the last restore that worked.",
    },
  }),
];
