/**
 * What the NIS 2 walk leaves out of the journey's front, and where each part every entity owes is
 * met. Data only, kept apart from the screen script (./nis2) so each stays readable on its own.
 */

/**
 * Items at the front of the journey the walk leaves out, each with the reason. The requirement
 * page keeps them.
 */
export const NOT_WALKED: Readonly<Record<string, string>> = {
  "12.1":
    "The walk does not decide the entity type for the company: setting the company up, right after the registration (12.2), asks for it with the thresholds of § 28 BSIG beside it.",
  "1.2":
    "No statute asks every entity to name roles: § 38 Abs. 1 BSIG and Art. 20(1) NIS 2 have management implement and oversee the measures. Roles, responsibilities and authorities are CIR 2024/2690 Annex 1.2, which binds only the digital providers the CIR covers, and a security officer is BSI advice (BSI-Standard 200-2). The walk names the people it needs where it needs them: whoever leads in an emergency in 3.1, with an invite for someone not in the team yet, and management for the approval in 7.3. The requirement page keeps the team and its roles.",
  "1.3":
    "No statute asks for a separately approved security budget: § 30 and § 38 BSIG ask management to implement and oversee the measures. The nearest rule, CIR 2024/2690 Annex 1.1.1(e), binds only the digital providers the CIR covers and asks for a commitment to provide resources inside the security policy, which the Leitlinie (2.4) carries in its section on responsibility (management „stellt dafür Zeit, Geld und Personal bereit“). The requirement page keeps the budget fields.",
  "1.4":
    "No statute asks management to sign an acknowledgement of liability; § 38 Abs. 2 BSIG sets the liability itself, which the CEO course behind 1.1 teaches. The acknowledgement is a platform record, so it stays on the requirement page.",
  "5.3":
    "§ 30 Abs. 2 Nr. 4 BSIG sets no review cycle for suppliers. What every entity owes is to weigh each direct supplier's specific vulnerabilities and the quality of its products and security practice when it chooses the measures (Art. 21(3) NIS 2, carried into § 30 by the Begründung, BT-Drs. 21/1501 p. 148): 2.3 rates each supplier, and 5.2 records the agreements beside that rating. Monitoring and reviewing suppliers at planned intervals is CIR 2024/2690 Annex 5.1.6 and 5.1.7, which binds only the digital providers the CIR covers. The supplier risk register stays on the requirement page.",
  "5.4":
    "Whether a supplier must report incidents to the company is one of the two points 5.2 records per supplier, where the Begründung to § 30 BSIG puts it (agreements on handling cyber incidents, BT-Drs. 21/1501 p. 148). No statute sets a notification deadline in hours; CIR 2024/2690 Annex 5.1.4(d), which binds only the digital providers it covers, says 'without undue delay'. The requirement page keeps the field.",
  "3.2":
    "Telling an incident from a disruption, and deciding whether to report it, is written into the 3.1 plan (whoever notices calls the IT emergency number, the lead decides), and 3.3 explains when an incident is significant, which § 2 Nr. 11 BSIG defines itself. Classification schemes, detection tooling, logging and the quarterly check for recurring incidents are CIR 2024/2690 Annex 3.2 to 3.4 and Art. 4, which bind only the digital providers the CIR covers; attack detection systems are a duty of operators of critical facilities only (§ 31 Abs. 2 BSIG). The incident register fills when an incident happens.",
  "3.5":
    "No statute asks for a named review owner or for customer messages written in advance. After a significant incident the final report states the cause and the measures taken (§ 32 Abs. 1 Nr. 4 BSIG), which 3.3 shows, and the 3.1 plan commits to reviewing each incident and offers informing customers as a clause. In Germany, telling the recipients of a service is a duty only when the BSI orders it (§ 35 Abs. 1 BSIG) or for the sectors § 35 Abs. 2 lists. Post-incident reviews are CIR 2024/2690 Annex 3.6, which binds only the digital providers the CIR covers.",
  "9.2":
    "Recording, per asset, the type and strength of encryption for data at rest and in transit is CIR 2024/2690 Annex 9.2(a), which binds only the digital providers the CIR covers; the BSI's Krypto-Kataster (IT-Grundschutz CON.1.A19) is a recommendation. § 30 Abs. 2 Nr. 8 BSIG asks for Konzepte und Prozesse, and the 9.1 Kryptokonzept says where the company encrypts, as clauses the person chooses. The per-asset table stays on the requirement page.",
  "9.3":
    "Key-management methods are CIR 2024/2690 Annex 9.2(c), which binds only the digital providers the CIR covers. The process § 30 Abs. 2 Nr. 8 BSIG asks for includes how keys and certificates are kept, renewed and replaced, and the 9.1 Kryptokonzept carries that as a fixed section. A key vault, a monitoring tool and an alert threshold in days are tooling no statute names, so the requirement page keeps those fields.",
  "10.2":
    "A register of the access rights granted is CIR 2024/2690 Annex 11.2.2(e), and the rules for privileged accounts are Annex 11.3; both bind only the digital providers the CIR covers. § 30 Abs. 2 Nr. 9 BSIG asks for a Konzept for access control, which 10.1 writes. The owner, access method and number of administrator accounts per asset stay on the requirement page.",
  "10.3":
    "Sicherheit des Personals (§ 30 Abs. 2 Nr. 9 BSIG) is part of the 10.1 Konzept: joining, changing role and leaving, and outside staff. Background checks are CIR 2024/2690 Annex 10.2 and the management of privileged accounts Annex 11.3, which bind only the digital providers the CIR covers; the names of a joiner-mover-leaver tool and a privileged-access tool are tooling no statute asks for. The requirement page keeps those fields.",
  "10.4":
    "No statute sets when access rights are reviewed: CIR 2024/2690 Annex 11.2.3 and 11.3.3 say 'at planned intervals' and bind only the digital providers the CIR covers. The 10.1 Konzept offers the review as a clause (yearly, administrator accounts quarterly, from the values the BSI suggests in Grundschutz++ BER.4.4). A review is a dated proof that cannot exist on the day the walk runs, so the requirement page records each one when it happens.",
  "11.3":
    "Changing credentials, blocking after failed sign-ins and ending inactive sessions are CIR 2024/2690 Annex 11.6.2(c) to (e), which binds only the digital providers the CIR covers; no statute and no CIR point sets a password length, and NIST SP 800-63B is a US standard. § 30 Abs. 2 Nr. 10 BSIG names multi-factor or continuous authentication, which 11.1 walks. The BSI's password rules (IT-Grundschutz ORP.4.A8) are a clause of the 10.1 Konzept, and the requirement page keeps the fields.",
  "6.1":
    "Security when buying IT is the 'Beim Kauf' section of the rules 6.3 writes, where § 30 Abs. 2 Nr. 5 BSIG names it together with development, maintenance and vulnerabilities. The editor's threshold, eight contract clauses and weighted criteria are CIR 2024/2690 detail (Annex 5.1.4 and 6.1) for the digital providers the CIR covers, with defaults no source sets; the requirement page keeps them.",
  "6.2":
    "Development applies only to a company that develops software or has it developed, so the rules 6.3 writes offer it as a clause, and secure set-up (changing default passwords, switching off what is not needed) is a section and a clause there too. The editor's framework, hardening baseline and test types are CIR 2024/2690 Annex 6.2, 6.3 and 6.5 detail for the digital providers the CIR covers; the requirement page keeps them.",
  "6.4":
    "Installing security updates is the 'Updates' section of the rules 6.3 writes, where § 30 Abs. 2 Nr. 5 BSIG puts maintenance together with vulnerability management. No statute sets patch deadlines; CIR 2024/2690 Annex 6.6 asks the digital providers it covers for 'a reasonable time' without a number, and the BSI recommends installing security updates automatically (Grundschutz++ KONF.8.1.1). The deadlines per severity and the patch register stay on the requirement page.",
  "6.5":
    "§ 30 Abs. 2 Nr. 5 BSIG and Art. 21(2)(e) NIS 2 name maintenance, not a change procedure; change management is CIR 2024/2690 Annex 6.4, for the digital providers the CIR covers. The BSI reads maintenance to include planned, documented changes (NIS-2 Infopaket on security measures), so the rules 6.3 writes offer that as a clause, and the change register stays on the requirement page.",
  "4.1":
    "No statute asks for a business impact analysis or for recovery time and point objectives: § 30 Abs. 2 Nr. 3 BSIG and Art. 21(2)(c) NIS 2 name Aufrechterhaltung des Betriebs, Backup-Management, Wiederherstellung nach einem Notfall and Krisenmanagement. The analysis is CIR 2024/2690 Annex 4.1.3, which binds only the digital providers the CIR covers, and BSI-Standard 200-4 recommends it. The plan 4.2 writes names what has to keep running and offers recovery targets as a clause; the requirement page keeps the analysis and its figures.",
  "4.3":
    "Recovery after an emergency is the Wiederherstellung section of the plan 4.2 writes, where § 30 Abs. 2 Nr. 3 BSIG names it together with continuity and crisis management. An order of recovery and recovery objectives per system are CIR 2024/2690 Annex 4.1.2(e) and (f), for the digital providers the CIR covers, and the BSI's guide for small companies places the Wiederanlaufplan from its Aufbau level on. The requirement page keeps each system's RTO and RPO.",
  "4.5":
    "No statute asks for a test of the continuity plan: § 30 Abs. 2 Nr. 3 BSIG names the measures, and Nr. 6 asks for procedures to assess effectiveness in general, which 7.x carries. Tests at planned intervals are CIR 2024/2690 Annex 4.1.4, 4.2.6 and 4.3.4, for the digital providers the CIR covers. The plan 4.2 writes offers a yearly exercise as a clause, after BSI-Standard 200-4, and the exercise register stays on the requirement page.",
  "8.1":
    "The Leitlinie is written in 2.4, and its last screen says to give it to every employee. No statute asks for a separate acceptable-use policy or for staff acknowledgements: those are CIR 2024/2690 Annex 1.1.1(f) and 1.2.2 for the digital providers the CIR covers, and announcing the Leitlinie to staff is BSI advice (IT-Grundschutz ISMS.1.A3). Telling staff the rules is an awareness measure under § 30 Abs. 2 Nr. 7 BSIG, recorded in 8.2.",
  "8.3":
    "§ 30 Abs. 2 Nr. 7 BSIG asks for 'grundlegende Schulungen und Sensibilisierungsmaßnahmen', not for training by role. Role-specific security training, including on a change of role, is CIR 2024/2690 Annex 8.2, which binds only the digital providers the CIR covers. Management training is § 38 Abs. 3 BSIG, walked in 1.1, and any other training can be recorded in 8.2.",
  "7.1":
    "Neither § 30 BSIG nor Art. 21 NIS 2 asks for security KPIs, a dashboard or a trend tool: § 30 Abs. 2 Nr. 6 asks for Konzepte und Verfahren zur Bewertung der Wirksamkeit. Indicators are CIR 2024/2690 Annex 1.1.1(j) and 7.2, which bind only the digital providers the CIR covers, and the BSI suggests them as advice. The procedure runs in the management review (7.3); the requirement page keeps the KPI register.",
  "7.2":
    "No statute asks every entity for internal audits. Independent reviews are CIR 2024/2690 Annex 2.3, which binds only the digital providers the CIR covers; audits every three years bind operators of critical facilities (§ 39 Abs. 1 BSIG), and the BSI may order audits of particularly important entities (§ 61 Abs. 1 BSIG). Regular reviews of effectiveness are BSI advice (IT-Grundschutz ISMS.1.A11). Effectiveness is checked in the management review (7.3); the requirement page keeps the audit plan.",
  "7.4":
    "Art. 21(4) NIS 2 asks that an entity that finds it does not comply takes corrective measures without undue delay; the BSIG has no separate sentence for it, and neither text asks for a register, a tool, counts or closure times. The measures management decides are recorded with the review in 7.3, where each open point the approval lists can be given who takes care of it and by when; that puts it on the improvement register, which the requirement page keeps.",
  "12.4":
    "The one duty here that binds every entity is to document compliance (§ 30 Abs. 1 S. 3 BSIG), and the Durchgang as a whole is that documentation: each item's records and documents, which management reviews and approves in 7.3. Attack detection and three-yearly evidence bind operators of critical facilities only (§ 31 Abs. 2, § 39 BSIG), so only a company whose profile says so walks 12.4, and the special registration binds only the § 60 Abs. 1 entity types (§ 34 BSIG). Handing documents over when the BSI asks follows from its supervisory powers (§ 61 Abs. 5, § 62 BSIG); a correspondence log and the BSI's information-sharing platform (§ 6 BSIG) are voluntary.",
  "3.4":
    "No statute requires an exercise. § 30 Abs. 2 Nr. 6 BSIG asks for concepts and procedures to assess whether the measures work, and an exercise is one way among others. Testing incident response at planned intervals is CIR 2024/2690 Annex 3.5.5 and 3.1.3, which bind only the digital providers the CIR covers. The 3.1 plan and the 4.2 plan each offer a yearly exercise as a clause.",
  "8.4":
    "No statute asks for phishing simulations or for testing training: CIR 2024/2690 Annex 8.1.3 and 8.2.3 ask the digital providers the CIR covers to test awareness and assess training, and the BSI names phishing-simulation results only as one example of an indicator. Whether awareness works can be raised in the management review (7.3); the requirement page keeps the simulation fields.",
};

/**
 * Where each item the walk leaves out is met: the walked items that carry the part of it every
 * entity owes, or `null` when no statute asks it of every entity. Checked against § 30, § 32, § 33
 * and § 38 BSIG and the walk's own copy (NIS2 reviews/legal/2026-10-03-walk-coverage-bsig.md).
 */
export const COVERED_BY: Readonly<Record<string, readonly string[] | null>> = {
  "12.1": null,
  "12.4": ["7.3"],
  "1.2": null,
  "1.3": null,
  "1.4": null,
  "5.3": ["2.3", "5.2"],
  "5.4": ["5.2"],
  "3.2": ["3.1", "3.3"],
  "3.4": ["3.1", "4.2"],
  "3.5": ["3.1", "3.3"],
  "9.2": ["9.1"],
  "9.3": ["9.1"],
  "10.2": ["10.1"],
  "10.3": ["10.1"],
  "10.4": ["10.1"],
  "11.3": ["11.1", "10.1"],
  "6.1": ["6.3"],
  "6.2": ["6.3"],
  "6.4": ["6.3"],
  "6.5": ["6.3"],
  "4.1": ["4.2"],
  "4.3": ["4.2"],
  "4.5": ["4.2"],
  "8.1": ["2.4", "8.2"],
  "8.3": ["1.1", "8.2"],
  "8.4": null,
  "7.1": ["7.3", "2.4"],
  "7.2": ["7.3", "2.4"],
  "7.4": ["7.3"],
};
