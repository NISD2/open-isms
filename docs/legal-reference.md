# NIS2 / BSIG Legal Reference — Requirement-to-Law Mapping

This document maps all 132 requirements in the NIS2 compliance platform to their specific legal sources in the **NIS2 Directive (EU) 2022/2555** and the **German BSI Act (BSIG 2025)**.

**Sources:**
- NIS2 Directive: https://www.nis-2-directive.com/
- BSIG 2025: https://www.gesetze-im-internet.de/bsig_2025/

---

## Category 1: Governance & Liability

**NIS2:** [Art. 20 — Governance](https://www.nis-2-directive.com/NIS_2_Directive_Article_20.html)
**BSIG:** [§38 — Umsetzungs-, Uberwachungs- und Schulungspflicht fur Geschaftsleitungen](https://www.gesetze-im-internet.de/bsig_2025/__38.html)

### Legal Text

> **Art. 20(1):** "Member States shall ensure that the management bodies of essential and important entities approve the cybersecurity risk-management measures taken by those entities in order to comply with Article 21, oversee its implementation and can be held liable for infringements by the entities of that Article."

> **Art. 20(2):** "Member States shall ensure that the members of the management bodies of essential and important entities are required to follow training [...] in order that they gain sufficient knowledge and skills to enable them to identify risks and assess cybersecurity risk-management practices and their impact on the services provided by the entity."

> **§38(1) BSIG:** "Geschaftsleitungen besonders wichtiger Einrichtungen und wichtiger Einrichtungen sind verpflichtet, die von diesen Einrichtungen nach §30 zu ergreifenden Risikomanagementmassnahmen umzusetzen und ihre Umsetzung zu uberwachen."

> **§38(2) BSIG:** "Geschaftsleitungen, die ihre Pflichten nach Absatz 1 verletzen, haften ihrer Einrichtung fur einen schuldhaft verursachten Schaden nach den auf die Rechtsform der Einrichtung anwendbaren Regeln des Gesellschaftsrechts."

> **§38(3) BSIG:** Management must regularly train to gain "ausreichende Kenntnisse und Fahigkeiten zur Erkennung und Bewertung von Risiken und von Risikomanagementpraktiken im Bereich der Sicherheit in der Informationstechnik."

### Requirements Mapping

| Code | Title | Legal Basis |
|------|-------|-------------|
| 1.1 | Formal management approval of cybersecurity measures | Art. 20(1) — "approve the cybersecurity risk-management measures"; §38(1) — "Risikomanagementmassnahmen umzusetzen" |
| 1.2 | Management oversight of implementation | Art. 20(1) — "oversee its implementation"; §38(1) — "ihre Umsetzung zu uberwachen" |
| 1.3 | Management cybersecurity training | Art. 20(2) — "required to follow training"; §38(3) — mandatory management training |
| 1.4 | Top-level information security policy | Art. 20(1) read with Art. 21(2)(a) — management approval implies policy ownership; §38(1) — implementation duty covers policy establishment |
| 1.5 | ISMS scope definition | Art. 21(1) — proportionate measures require defined scope; §30(1) — measures must cover all relevant systems |
| 1.6 | Cybersecurity roles and responsibilities | Art. 20(1) — oversight requires clear accountability structure; §38(1) — management oversight implies organizational structure |
| 1.7 | Cybersecurity budget allocation | Art. 20(1) — approval duty implies resource provision; §30(1) — "geeignete, verhaltnismassige und wirksame" measures require adequate funding |
| 1.8 | Personal liability acknowledgment | Art. 20(1) — "can be held liable for infringements"; §38(2) — subsidiary personal liability under company law (the draft's waiver-invalidity clause was NOT enacted; §38(2) creates no acknowledgment duty) |

---

## Category 2: Risk Management

**NIS2:** [Art. 21(2)(a) — Risk analysis and information system security policies](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html)
**BSIG:** [§30(1) Nr. 1 — Risikoanalyse- und IT-Sicherheitskonzepte](https://www.gesetze-im-internet.de/bsig_2025/__30.html)

### Legal Text

> **Art. 21(1):** "Member States shall ensure that essential and important entities take appropriate and proportionate technical, operational and organisational measures to manage the risks posed to the security of network and information systems [...]."

> **Art. 21(2)(a):** "[Measures shall include at minimum] policies on risk analysis and information system security."

> **§30(1) BSIG:** Entities must take "geeignete, verhaltnismassige und wirksame technische und organisatorische Massnahmen" to prevent disruptions to availability, integrity, and confidentiality. Proportionality assessment must consider risk exposure, entity size, implementation costs, incident likelihood and severity. Compliance must be documented ("Die Einhaltung ist zu dokumentieren").

> **§30(2) Nr. 1 BSIG:** "Konzepte in Bezug auf die Risikoanalyse und Sicherheit fur Informationssysteme."

### Requirements Mapping

| Code | Title | Legal Basis |
|------|-------|-------------|
| 2.1 | Information security policy | Art. 21(2)(a) — "policies on [...] information system security"; §30(2) Nr. 1 — "Sicherheit fur Informationssysteme" |
| 2.2 | Risk assessment methodology | Art. 21(2)(a) — "policies on risk analysis"; §30(2) Nr. 1 — "Konzepte in Bezug auf die Risikoanalyse" |
| 2.3 | Asset inventory | Art. 21(1) — proportionate measures require knowledge of assets; §30(1) — measures must address "Verfugbarkeit, Integritat und Vertraulichkeit" of identified systems |
| 2.4 | Risk register | Art. 21(2)(a) — "risk analysis" requires documented risk records; §30(2) Nr. 1 — "Risikoanalyse" implies systematic risk tracking |
| 2.5 | Risk treatment plan | Art. 21(2)(a) — risk analysis must lead to treatment decisions; §30(1) — "geeignete [...] Massnahmen" to minimize incident impact |
| 2.6 | ISMS scope definition | Art. 21(1) — "manage the risks posed to the security of network and information systems"; §30(1) — scope of measures must be documented |
| 2.7 | Annual risk review | Art. 21(1) — measures must remain "appropriate and proportionate" over time; §30(1) — ongoing documentation obligation implies periodic review |
| 2.8 | Management risk acceptance | Art. 20(1) combined with Art. 21(2)(a) — management approval covers residual risk acceptance; §38(1) — implementation duty includes risk treatment decisions |
| 2.9 | OT/ICS asset inventory | Art. 21(1) — "all-hazards approach" (para 2) covers OT; §30(1) — measures apply to all "Informationssysteme" including operational technology |
| 2.10 | Data classification scheme | Art. 21(2)(a) — information system security requires data classification; §30(1) — proportionate measures require understanding data sensitivity |

---

## Category 3: Incident Handling

**NIS2:** [Art. 21(2)(b) — Incident handling](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html), [Art. 23 — Reporting obligations](https://www.nis-2-directive.com/NIS_2_Directive_Article_23.html)
**BSIG:** [§30(2) Nr. 2 — Bewaltigung von Sicherheitsvorfallen](https://www.gesetze-im-internet.de/bsig_2025/__30.html), [§32 — Meldepflichten](https://www.gesetze-im-internet.de/bsig_2025/__32.html)

### Legal Text

> **Art. 21(2)(b):** "[Measures shall include at minimum] incident handling."

> **Art. 23(1):** Entities must notify their CSIRT or competent authority "without undue delay" of significant incidents.

> **Art. 23(4):** Timeline: (a) 24-hour early warning; (b) 72-hour detailed notification with initial severity assessment and indicators of compromise; (d) final report within one month with root cause analysis, remediation measures, and cross-border impact.

> **§30(2) Nr. 2 BSIG:** "Bewaltigung von Sicherheitsvorfallen."

> **§32(1) BSIG:** Mandatory reports: (1) 24-hour early warning ("unverzuglich, spatestens jedoch innerhalb von 24 Stunden"); (2) 72-hour detailed notification with severity assessment and indicators of compromise; (3) intermediate reports on BSI request; (4) final report within one month with root cause analysis and cross-border impact.

### Requirements Mapping

| Code | Title | Legal Basis |
|------|-------|-------------|
| 3.1 | Incident response plan | Art. 21(2)(b) — "incident handling"; §30(2) Nr. 2 — "Bewaltigung von Sicherheitsvorfallen" |
| 3.2 | Incident classification criteria | Art. 23(3) — "significant incident" definition triggers reporting; §32(1) — "erheblicher Sicherheitsvorfall" threshold |
| 3.3 | BSI contact registration | Art. 23(1) — entity must be capable of notifying authority; §32(1) — reports go to "gemeinsame Meldestelle"; §33 — registration includes contact person |
| 3.4 | 24-hour early warning process | Art. 23(4)(a) — 24-hour early warning; §32(1) Nr. 1 — "innerhalb von 24 Stunden [...] eine fruhe Erstmeldung" |
| 3.5 | 72-hour detailed notification | Art. 23(4)(b) — 72-hour notification with severity assessment and IOCs; §32(1) Nr. 2 — "innerhalb von 72 Stunden [...] Bewertung, Schweregrad und Kompromittierungsindikatoren" |
| 3.6 | One-month final report | Art. 23(4)(d) — final report within one month; §32(1) Nr. 4 — "Abschlussmeldung innerhalb eines Monats" with root cause and remediation |
| 3.7 | Incident response team | Art. 21(2)(b) — incident handling requires organized response capability; §30(2) Nr. 2 — effective incident management implies dedicated team |
| 3.8 | Incident logging | Art. 21(2)(b) — incident handling requires tracking; §30(1) — documentation obligation ("Die Einhaltung ist zu dokumentieren") |
| 3.9 | Incident response playbooks | Art. 21(2)(b) — incident handling requires prepared procedures; §30(2) Nr. 2 — effective incident management implies pre-defined responses |
| 3.10 | Incident response testing | Art. 21(2)(f) — "policies [...] assessing the effectiveness of cybersecurity risk-management measures"; §30(2) Nr. 6 — "Konzepte zur Wirksamkeitsbewertung" applies to incident procedures |
| 3.11 | Customer/public notification templates | Art. 23(2) — entities must inform affected service recipients; §39 — "Unterrichtungspflichten" notification duties |
| 3.12 | Dual BSI/GDPR reporting coordination | Art. 23(6) — NIS2 notification does not exempt from other reporting obligations; §32 — BSI reporting parallel to GDPR Art. 33 |

---

## Category 4: Business Continuity

**NIS2:** [Art. 21(2)(c) — Business continuity, backup management, disaster recovery, crisis management](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html)
**BSIG:** [§30(2) Nr. 3 — Aufrechterhaltung des Betriebs, Backup-Management, Wiederherstellung, Krisenmanagement](https://www.gesetze-im-internet.de/bsig_2025/__30.html)

### Legal Text

> **Art. 21(2)(c):** "[Measures shall include at minimum] business continuity, such as backup management and disaster recovery, and crisis management."

> **§30(2) Nr. 3 BSIG:** "Aufrechterhaltung des Betriebs, Backup-Management und Wiederherstellung nach einem Notfall und Krisenmanagement."

### Requirements Mapping

| Code | Title | Legal Basis |
|------|-------|-------------|
| 4.1 | Business impact analysis | Art. 21(2)(c) — "business continuity" requires understanding critical functions; §30(2) Nr. 3 — "Aufrechterhaltung des Betriebs" presupposes impact analysis |
| 4.2 | Business continuity plan | Art. 21(2)(c) — "business continuity"; §30(2) Nr. 3 — "Aufrechterhaltung des Betriebs" |
| 4.3 | Disaster recovery plan | Art. 21(2)(c) — "disaster recovery"; §30(2) Nr. 3 — "Wiederherstellung nach einem Notfall" |
| 4.4 | RTO/RPO definitions | Art. 21(2)(c) — "disaster recovery" requires measurable recovery targets; §30(2) Nr. 3 — effective recovery implies defined time objectives |
| 4.5 | Backup policy | Art. 21(2)(c) — "backup management"; §30(2) Nr. 3 — "Backup-Management" |
| 4.6 | Backup restoration testing | Art. 21(2)(c) read with Art. 21(2)(f) — backup management effectiveness must be verified; §30(2) Nr. 3 + Nr. 6 — backup measures must be tested |
| 4.7 | Offline/immutable backups | Art. 21(2)(c) — "backup management" must withstand attack scenarios; §30(2) Nr. 3 — "Wiederherstellung nach einem Notfall" includes ransomware scenarios |
| 4.8 | Crisis management team | Art. 21(2)(c) — "crisis management"; §30(2) Nr. 3 — "Krisenmanagement" |
| 4.9 | Crisis communication templates | Art. 21(2)(c) — "crisis management" includes communications; §30(2) Nr. 3 — "Krisenmanagement" encompasses stakeholder communication |
| 4.10 | Tabletop exercises | Art. 21(2)(c) read with Art. 21(2)(f) — crisis management effectiveness testing; §30(2) Nr. 3 + Nr. 6 — crisis plans must be validated |
| 4.11 | Annual BCP/DR full-scale test | Art. 21(2)(c) + (f) — business continuity + effectiveness assessment; §30(2) Nr. 3 + Nr. 6 — recovery capabilities must be proven |
| 4.12 | BCP review and update cycle | Art. 21(2)(c) — "business continuity" measures must remain current; §30(1) — proportionality requires measures adapt to changing risks |

---

## Category 5: Supply Chain Security

**NIS2:** [Art. 21(2)(d) — Supply chain security](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html)
**BSIG:** [§30(2) Nr. 4 — Sicherheit der Lieferkette](https://www.gesetze-im-internet.de/bsig_2025/__30.html)

### Legal Text

> **Art. 21(2)(d):** "[Measures shall include at minimum] supply chain security, including security-related aspects concerning the relationships between each entity and its direct suppliers or service providers."

> **Art. 21(3):** "Member States shall ensure that, when considering which measures [...] are appropriate, entities take into account the vulnerabilities specific to each direct supplier and service provider and the overall quality of products and cybersecurity practices of their suppliers and service providers, including their secure development procedures."

> **§30(2) Nr. 4 BSIG:** "Sicherheit der Lieferkette einschliesslich sicherheitsbezogener Aspekte der Beziehungen zwischen den einzelnen Einrichtungen und ihren unmittelbaren Anbietern oder Diensteanbietern."

### Requirements Mapping

| Code | Title | Legal Basis |
|------|-------|-------------|
| 5.1 | Supply chain security policy | Art. 21(2)(d) — "supply chain security"; §30(2) Nr. 4 — "Sicherheit der Lieferkette" |
| 5.2 | Supplier inventory | Art. 21(2)(d) — "relationships between each entity and its direct suppliers"; §30(2) Nr. 4 — "Beziehungen zwischen den einzelnen Einrichtungen und ihren unmittelbaren Anbietern" |
| 5.3 | Critical supplier identification | Art. 21(3) — "vulnerabilities specific to each direct supplier"; §30(2) Nr. 4 — risk-based approach to supplier relationships |
| 5.4 | Supplier security assessment process | Art. 21(3) — "overall quality of products and cybersecurity practices of their suppliers"; §30(2) Nr. 4 — security aspects of supplier relationships |
| 5.5 | Security questionnaire | Art. 21(3) — assessment of supplier cybersecurity practices; §30(2) Nr. 4 — operationalization of supplier security assessment |
| 5.6 | Contractual security clauses | Art. 21(2)(d) — "security-related aspects concerning the relationships"; §30(2) Nr. 4 — "sicherheitsbezogener Aspekte der Beziehungen" |
| 5.7 | Supplier audit rights | Art. 21(3) — ongoing assessment of supplier practices; §30(2) Nr. 4 — verification of supplier security measures |
| 5.8 | Subcontractor flow-down | Art. 21(2)(d) — "supply chain security" extends beyond direct suppliers; §30(2) Nr. 4 — chain responsibility |
| 5.9 | Ongoing supplier monitoring | Art. 21(3) — ongoing assessment requirement; §30(2) Nr. 4 — continuous security of supplier relationships |
| 5.10 | Non-cooperative supplier handling | Art. 21(2)(d) — supply chain security requires addressing non-compliance; §30(1) — proportionate measures for supply chain risks |
| 5.11 | Supplier incident notification tracking | Art. 21(2)(d) + Art. 23 — supply chain security + reporting chain; §30(2) Nr. 4 + §32 — supplier incidents may trigger entity reporting |

---

## Category 6: Procurement & Development Security

**NIS2:** [Art. 21(2)(e) — Security in network and information systems acquisition, development, and maintenance, including vulnerability handling and disclosure](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html)
**BSIG:** [§30(2) Nr. 5 — Sicherheitsmassnahmen bei Erwerb, Entwicklung und Wartung](https://www.gesetze-im-internet.de/bsig_2025/__30.html)

### Legal Text

> **Art. 21(2)(e):** "[Measures shall include at minimum] security in network and information systems acquisition, development and maintenance, including vulnerability handling and disclosure."

> **§30(2) Nr. 5 BSIG:** "Sicherheitsmassnahmen bei Erwerb, Entwicklung und Wartung von informationstechnischen Systemen, Komponenten und Prozessen, einschliesslich des Managements und der Offenlegung von Schwachstellen."

### Requirements Mapping

| Code | Title | Legal Basis |
|------|-------|-------------|
| 6.1 | Secure procurement policy | Art. 21(2)(e) — "security in [...] acquisition"; §30(2) Nr. 5 — "Sicherheitsmassnahmen bei Erwerb" |
| 6.2 | Procurement security checklist | Art. 21(2)(e) — "security in [...] acquisition"; §30(2) Nr. 5 — "Erwerb von informationstechnischen Systemen" |
| 6.3 | Patch management policy | Art. 21(2)(e) — "vulnerability handling"; §30(2) Nr. 5 — "Management [...] von Schwachstellen" |
| 6.4 | Patch status tracking | Art. 21(2)(e) — "vulnerability handling" requires tracking; §30(2) Nr. 5 — "Management von Schwachstellen" |
| 6.5 | Vulnerability management process | Art. 21(2)(e) — "vulnerability handling and disclosure"; §30(2) Nr. 5 — "Management und Offenlegung von Schwachstellen" |
| 6.6 | Automated vulnerability scanning | Art. 21(2)(e) — "vulnerability handling" requires identification; §30(2) Nr. 5 — vulnerability management implies systematic scanning |
| 6.7 | Penetration testing | Art. 21(2)(e) — "vulnerability handling" includes proactive identification; §30(2) Nr. 5 + Nr. 6 — vulnerability management + effectiveness assessment |
| 6.8 | Change management process | Art. 21(2)(e) — "security in [...] maintenance"; §30(2) Nr. 5 — "Sicherheitsmassnahmen bei [...] Wartung" |
| 6.9 | Change log and audit trail | Art. 21(2)(e) — maintenance security requires traceability; §30(1) — documentation obligation |
| 6.10 | Secure development guidelines (SDLC) | Art. 21(2)(e) — "security in [...] development"; §30(2) Nr. 5 — "Sicherheitsmassnahmen bei [...] Entwicklung" |
| 6.11 | Vulnerability disclosure policy | Art. 21(2)(e) — "vulnerability [...] disclosure"; §30(2) Nr. 5 — "Offenlegung von Schwachstellen" |
| 6.12 | Secure configuration baselines | Art. 21(2)(e) — "security in [...] maintenance"; §30(2) Nr. 5 — "Wartung von informationstechnischen Systemen" |

---

## Category 7: Effectiveness Assessment

**NIS2:** [Art. 21(2)(f) — Policies and procedures to assess the effectiveness of cybersecurity risk-management measures](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html)
**BSIG:** [§30(2) Nr. 6 — Konzepte und Verfahren zur Bewertung der Wirksamkeit von Risikomanagementmassnahmen](https://www.gesetze-im-internet.de/bsig_2025/__30.html)

### Legal Text

> **Art. 21(2)(f):** "[Measures shall include at minimum] policies and procedures to assess the effectiveness of cybersecurity risk-management measures."

> **§30(2) Nr. 6 BSIG:** "Konzepte und Verfahren zur Bewertung der Wirksamkeit von Risikomanagementmassnahmen im Bereich der Sicherheit in der Informationstechnik."

### Requirements Mapping

| Code | Title | Legal Basis |
|------|-------|-------------|
| 7.1 | Internal audit plan | Art. 21(2)(f) — "policies and procedures to assess effectiveness"; §30(2) Nr. 6 — "Konzepte und Verfahren zur Bewertung der Wirksamkeit" |
| 7.2 | Internal audit execution and reporting | Art. 21(2)(f) — effectiveness assessment must produce results; §30(2) Nr. 6 — "Bewertung der Wirksamkeit" implies formal findings |
| 7.3 | Security KPIs and KRIs | Art. 21(2)(f) — "assess the effectiveness" requires measurable indicators; §30(2) Nr. 6 — "Bewertung der Wirksamkeit" implies quantitative metrics |
| 7.4 | Monthly KPI dashboards | Art. 21(2)(f) — ongoing effectiveness assessment; §30(2) Nr. 6 — regular effectiveness measurement |
| 7.5 | Annual management review | Art. 21(2)(f) read with Art. 20(1) — effectiveness reporting to management; §30(2) Nr. 6 + §38(1) — management must oversee measure effectiveness |
| 7.6 | NIS2 compliance gap analysis | Art. 21(2)(f) — assess effectiveness against NIS2 requirements; §30(2) Nr. 6 — gap analysis is a core effectiveness assessment method |
| 7.7 | KRITIS: Triennial external audit | Art. 21(2)(f) — external effectiveness verification; §39 — "Nachweispflichten": compliance proof through "Sicherheitsaudits, Prufungen oder Zertifizierungen" every three years |
| 7.8 | Penetration test results review | Art. 21(2)(f) — "assess the effectiveness" of technical controls; §30(2) Nr. 6 — technical effectiveness verification |
| 7.9 | BSI Grundschutz self-assessment | Art. 21(2)(f) — effectiveness assessment using recognized framework; §30(2) Nr. 6 + §30(2) sentence 1 — measures must follow "Stand der Technik" and European/international standards |
| 7.10 | Continuous improvement register | Art. 21(2)(f) — effectiveness assessment drives improvement; §30(2) Nr. 6 — effectiveness assessment implies corrective action tracking (see also Art. 21(4) — "adopt corrective measures without undue delay") |

---

## Category 8: Cyber Hygiene & Training

**NIS2:** [Art. 21(2)(g) — Basic cyber hygiene practices and cybersecurity training](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html)
**BSIG:** [§30(2) Nr. 7 — Grundlegende Verfahren im Bereich der Cyberhygiene und Schulungen](https://www.gesetze-im-internet.de/bsig_2025/__30.html)

### Legal Text

> **Art. 21(2)(g):** "[Measures shall include at minimum] basic cyber hygiene practices and cybersecurity training."

> **Art. 20(2):** "Member States shall ensure that the members of the management bodies [...] are required to follow training, and shall encourage essential and important entities to offer similar training to their employees on a regular basis."

> **§30(2) Nr. 7 BSIG:** "Grundlegende Verfahren im Bereich der Cyberhygiene und Schulungen im Bereich der Sicherheit in der Informationstechnik."

> **§38(3) BSIG:** Management must train to develop "ausreichende Kenntnisse und Fahigkeiten zur Erkennung und Bewertung von Risiken und von Risikomanagementpraktiken."

### Requirements Mapping

| Code | Title | Legal Basis |
|------|-------|-------------|
| 8.1 | Security awareness program | Art. 21(2)(g) — "cybersecurity training"; §30(2) Nr. 7 — "Schulungen im Bereich der Sicherheit" |
| 8.2 | New employee security onboarding | Art. 21(2)(g) — "basic cyber hygiene practices"; §30(2) Nr. 7 — "grundlegende Verfahren im Bereich der Cyberhygiene" |
| 8.3 | Annual security awareness training | Art. 20(2) — "offer similar training to their employees on a regular basis"; §30(2) Nr. 7 — "Schulungen" |
| 8.4 | Phishing awareness training | Art. 21(2)(g) — "basic cyber hygiene practices"; §30(2) Nr. 7 — "Cyberhygiene" |
| 8.5 | Mandatory management NIS2 training | Art. 20(2) — "management bodies [...] are required to follow training"; §38(3) — non-delegable management training duty |
| 8.6 | Role-specific technical training | Art. 21(2)(g) — "cybersecurity training" for specialized roles; §30(2) Nr. 7 — "Schulungen im Bereich der Sicherheit" |
| 8.7 | Centralized training records | Art. 21(2)(g) — training measures must be documented; §30(1) — "Die Einhaltung ist zu dokumentieren" applies to training |
| 8.8 | Acceptable use policy | Art. 21(2)(g) — "basic cyber hygiene practices"; §30(2) Nr. 7 — "grundlegende Verfahren im Bereich der Cyberhygiene" |
| 8.9 | Clean desk / clear screen policy | Art. 21(2)(g) — "basic cyber hygiene practices"; §30(2) Nr. 7 — "Cyberhygiene" |
| 8.10 | Simulated phishing campaigns | Art. 21(2)(g) + Art. 21(2)(f) — training effectiveness must be measured; §30(2) Nr. 7 + Nr. 6 — training measures + effectiveness assessment |
| 8.11 | Security champion program | Art. 21(2)(g) — "cybersecurity training" embedded in departments; §30(2) Nr. 7 — organizational training measures |
| 8.12 | Training effectiveness measurement | Art. 21(2)(f) applied to training — "assess the effectiveness"; §30(2) Nr. 6 + Nr. 7 — effectiveness assessment of training measures |

---

## Category 9: Cryptography & Encryption

**NIS2:** [Art. 21(2)(h) — Policies and procedures regarding the use of cryptography and, where appropriate, encryption](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html)
**BSIG:** [§30(2) Nr. 8 — Konzepte und Verfahren fur den Einsatz von Kryptografie und Verschlusselung](https://www.gesetze-im-internet.de/bsig_2025/__30.html)

### Legal Text

> **Art. 21(2)(h):** "[Measures shall include at minimum] policies and procedures regarding the use of cryptography and, where appropriate, encryption."

> **§30(2) Nr. 8 BSIG:** "Konzepte und Verfahren fur den Einsatz von Kryptografie und gegebenenfalls Verschlusselung."

### Requirements Mapping

| Code | Title | Legal Basis |
|------|-------|-------------|
| 9.1 | Encryption policy (BSI TR-02102 aligned) | Art. 21(2)(h) — "policies [...] regarding the use of cryptography"; §30(2) Nr. 8 — "Konzepte [...] fur den Einsatz von Kryptografie"; §30(2) sentence 1 — "Stand der Technik" → BSI TR-02102 |
| 9.2 | Encryption at rest | Art. 21(2)(h) — "where appropriate, encryption"; §30(2) Nr. 8 — "Verschlusselung" |
| 9.3 | Encryption in transit (TLS) | Art. 21(2)(h) — "where appropriate, encryption"; §30(2) Nr. 8 — "Verschlusselung" |
| 9.4 | Key management policy | Art. 21(2)(h) — "procedures regarding the use of cryptography"; §30(2) Nr. 8 — "Verfahren fur den Einsatz von Kryptografie" |
| 9.5 | Key management infrastructure (HSM/vault) | Art. 21(2)(h) — "procedures regarding the use of cryptography" requires infrastructure; §30(2) Nr. 8 — technical implementation of key management |
| 9.6 | Certificate management | Art. 21(2)(h) — cryptography procedures include certificate lifecycle; §30(2) Nr. 8 — operational cryptography management |
| 9.7 | Cryptographic systems inventory | Art. 21(2)(h) — "policies [...] regarding the use of cryptography" requires inventory; §30(1) — documentation obligation for all measures |
| 9.8 | Algorithm review and PQC readiness | Art. 21(2)(h) — cryptography policies must stay current; §30(2) sentence 1 — "Stand der Technik einhalten und europaische und internationale Normen berucksichtigen" |
| 9.9 | Backup encryption | Art. 21(2)(h) + Art. 21(2)(c) — cryptography applied to backup management; §30(2) Nr. 8 + Nr. 3 — encryption + backup management |
| 9.10 | End-to-end encrypted crisis communications | Art. 21(2)(h) + Art. 21(2)(j) — cryptography + secured emergency communications; §30(2) Nr. 8 + Nr. 10 — encryption + emergency communication systems |

---

## Category 10: Access Control & HR Security

**NIS2:** [Art. 21(2)(i) — Human resources security, access control policies, and asset management](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html)
**BSIG:** [§30(2) Nr. 9 — Personalsicherheit, Zugriffskontrolle und Management von Anlagen](https://www.gesetze-im-internet.de/bsig_2025/__30.html)

### Legal Text

> **Art. 21(2)(i):** "[Measures shall include at minimum] human resources security, access control policies and asset management."

> **§30(2) Nr. 9 BSIG:** "Konzepte fur die Sicherheit des Personals, Konzepte fur die Zugriffskontrolle und fur das Management von Anlagen."

### Requirements Mapping

| Code | Title | Legal Basis |
|------|-------|-------------|
| 10.1 | Access control policy (least privilege, SoD) | Art. 21(2)(i) — "access control policies"; §30(2) Nr. 9 — "Konzepte fur die Zugriffskontrolle" |
| 10.2 | User access provisioning process | Art. 21(2)(i) — "access control policies"; §30(2) Nr. 9 — "Zugriffskontrolle" |
| 10.3 | Privileged account management (PAM) | Art. 21(2)(i) — "access control policies"; §30(2) Nr. 9 — "Zugriffskontrolle" with elevated requirements for admin access |
| 10.4 | Periodic access reviews | Art. 21(2)(i) — "access control policies" require ongoing verification; §30(2) Nr. 9 — "Zugriffskontrolle" implies review mechanisms |
| 10.5 | Security onboarding checklist | Art. 21(2)(i) — "human resources security"; §30(2) Nr. 9 — "Sicherheit des Personals" |
| 10.6 | Offboarding and access revocation | Art. 21(2)(i) — "human resources security" + "access control policies"; §30(2) Nr. 9 — "Sicherheit des Personals" + "Zugriffskontrolle" |
| 10.7 | IT asset assignment register | Art. 21(2)(i) — "asset management"; §30(2) Nr. 9 — "Management von Anlagen" |
| 10.8 | Role-Based Access Control (RBAC) | Art. 21(2)(i) — "access control policies"; §30(2) Nr. 9 — "Konzepte fur die Zugriffskontrolle" |
| 10.9 | Privileged account inventory | Art. 21(2)(i) — "access control policies" for privileged accounts; §30(2) Nr. 9 — "Zugriffskontrolle" |
| 10.10 | Service account management | Art. 21(2)(i) — "access control policies" cover non-human accounts; §30(2) Nr. 9 — "Zugriffskontrolle" |
| 10.11 | Remote access policy | Art. 21(2)(i) — "access control policies" for remote access; §30(2) Nr. 9 — "Zugriffskontrolle" |
| 10.12 | Physical access controls | Art. 21(2)(i) — "access control policies" include physical access; §30(2) Nr. 9 — "Zugriffskontrolle" + "Management von Anlagen" |

---

## Category 11: Authentication & Secure Communications

**NIS2:** [Art. 21(2)(j) — Multi-factor authentication, continuous authentication, secured communications, and secured emergency communications](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html)
**BSIG:** [§30(2) Nr. 10 — Verwendung von Losungen zur Multi-Faktor-Authentifizierung, gesicherte Kommunikation und Notfallkommunikationssysteme](https://www.gesetze-im-internet.de/bsig_2025/__30.html)

### Legal Text

> **Art. 21(2)(j):** "[Measures shall include at minimum] the use of multi-factor authentication or continuous authentication solutions, secured voice, video and text communications and secured emergency communication systems within the entity, where appropriate."

> **§30(2) Nr. 10 BSIG:** "Verwendung von Losungen zur Multi-Faktor-Authentifizierung oder kontinuierlichen Authentifizierung, gesicherte Sprach-, Video- und Textkommunikation sowie gegebenenfalls gesicherte Notfallkommunikationssysteme innerhalb der Einrichtung."

### Requirements Mapping

| Code | Title | Legal Basis |
|------|-------|-------------|
| 11.1 | MFA deployment plan | Art. 21(2)(j) — "the use of multi-factor authentication"; §30(2) Nr. 10 — "Verwendung von Losungen zur Multi-Faktor-Authentifizierung" |
| 11.2 | MFA for privileged accounts | Art. 21(2)(j) — "multi-factor authentication" (highest priority for admin); §30(2) Nr. 10 — MFA for privileged access |
| 11.3 | MFA for internet-facing services | Art. 21(2)(j) — "multi-factor authentication [...] where appropriate" (internet = always appropriate); §30(2) Nr. 10 — MFA for external access |
| 11.4 | MFA for regular users (risk-based) | Art. 21(2)(j) — "multi-factor authentication [...] where appropriate"; §30(2) Nr. 10 — risk-based MFA extension |
| 11.5 | MFA method selection rationale | Art. 21(2)(j) — "multi-factor authentication or continuous authentication solutions" implies method evaluation; §30(2) sentence 1 — "Stand der Technik" for authentication methods |
| 11.6 | Authentication procedures review | Art. 21(2)(j) + Art. 21(2)(f) — authentication + effectiveness assessment; §30(2) Nr. 10 + Nr. 6 — authentication measures + effectiveness review |
| 11.7 | Secure communication policy | Art. 21(2)(j) — "secured voice, video and text communications"; §30(2) Nr. 10 — "gesicherte Sprach-, Video- und Textkommunikation" |
| 11.8 | Emergency communication plan (out-of-band) | Art. 21(2)(j) — "secured emergency communication systems within the entity"; §30(2) Nr. 10 — "gesicherte Notfallkommunikationssysteme innerhalb der Einrichtung" |
| 11.9 | E2E encrypted communication tools | Art. 21(2)(j) — "secured voice, video and text communications"; §30(2) Nr. 10 — "gesicherte Sprach-, Video- und Textkommunikation" |
| 11.10 | MFA exception register | Art. 21(2)(j) — "where appropriate" allows documented exceptions; §30(1) — proportionality principle + documentation obligation |
| 11.11 | Password policy (NIST/BSI aligned) | Art. 21(2)(j) — authentication measures include password controls; §30(2) Nr. 10 — authentication, read with §30(2) sentence 1 — "Stand der Technik" |

---

## Category 12: Registration & Reporting

**NIS2:** [Art. 23 — Reporting obligations](https://www.nis-2-directive.com/NIS_2_Directive_Article_23.html), [Art. 3 — Essential and important entities](https://www.nis-2-directive.com/NIS_2_Directive_Article_3.html)
**BSIG:** [§33 — Registrierungspflicht](https://www.gesetze-im-internet.de/bsig_2025/__33.html), [§34 — Besondere Registrierungspflicht](https://www.gesetze-im-internet.de/bsig_2025/__34.html), [§39 — Nachweispflichten](https://www.gesetze-im-internet.de/bsig_2025/__39.html)

### Legal Text

> **Art. 3(3)-(4):** Member States must establish entity lists by April 17, 2025. Entities must submit: name, contact details, sector/subsector, service locations. Changes require notification "within two weeks."

> **Art. 23:** Comprehensive incident reporting obligations to CSIRT/competent authority. Significant incidents: 24h early warning, 72h notification, 1-month final report.

> **§33(1) BSIG:** Registration within three months of becoming an in-scope entity. Required data: name, legal form, address, contact details, sector/industry, affected EU member states, supervisory authorities.

> **§33(2) BSIG (as enacted):** One sentence only: "Die Registrierung von kritischen Anlagen erfolgt gemäß § 8 des KRITIS-Dachgesetzes." The draft's KRITIS data catalogue and "jederzeit erreichbar" contact-point sentence were not enacted here; KRITIS registration content now lives in the KRITIS-Dachgesetz. (Curiosity: §65(2) Nr. 7 still fines violations of a "§33 Absatz 2 Satz 2" that no longer exists — a dangling cross-reference; do not build product copy on it.)

> **§33(5) BSIG (as enacted):** All changes to §33(1) data "unverzüglich, spätestens jedoch binnen zwei Wochen ab dem Zeitpunkt, zu dem die Einrichtung Kenntnis von der Änderung erhalten hat". There is NO annual update component in the enacted §33(5); the draft's annual supply-metric rule was dropped.

> **§34 BSIG:** Special registration for certain entity types within three months, including IP address ranges.

> **§39(1) BSIG:** KRITIS operators must prove compliance through "Sicherheitsaudits, Prufungen oder Zertifizierungen" — earliest three years after first classification, then every three years.

### Requirements Mapping

| Code | Title | Legal Basis |
|------|-------|-------------|
| 12.1 | NIS2 applicability self-assessment | Art. 3(1)-(2) — entity classification criteria (essential vs. important); §33(1) — registration presupposes classification determination |
| 12.2 | Entity classification documentation | Art. 3(1)-(2) — classification as essential or important entity; §33(1) — "besonders wichtige Einrichtungen und wichtige Einrichtungen" |
| 12.3 | MUK account setup (ELSTER) | §33(1) — BSI portal registration requires MUK/ELSTER (German procedural prerequisite, no direct NIS2 equivalent) |
| 12.4 | BSI portal registration by deadline | Art. 3(3) — entity lists by April 17, 2025; §33(1) — registration within three months, deadline 6 March 2026 for initial cohort |
| 12.5 | Registration data submission | Art. 3(3)-(4) — name, contact, sector, service locations; §33(1) — name, legal form, address, contacts, sector, EU countries, supervisory authorities; §34(1) — IP address ranges |
| 12.6 | KRITIS: Facility-specific data | §33(2) as enacted delegates KRITIS registration to §8 KRITIS-Dachgesetz; facility data requirements live there, not in the BSIG |
| 12.7 | Annual registration data review | Recommended practice only — the enacted §33(5) contains no annual element (the draft's annual supply-metric rule was dropped); Art. 3(3) list reviews are a member-state duty |
| 12.8 | Two-week change notification to BSI | Art. 3(4) — changes notified "within two weeks"; §33(5) — "unverzuglich, spatestens jedoch zwei Wochen" |
| 12.9 | BSI contact person reachability | Practice, not a cited duty: the enacted §33(2) no longer carries the "jederzeit erreichbar" sentence (§65(2) Nr. 7's reference to it dangles); contact data currency is enforced via §33(5) |
| 12.10 | KRITIS: Triennial compliance evidence | §39(1) — compliance proof through "Sicherheitsaudits, Prufungen oder Zertifizierungen" every three years |
| 12.11 | KRITIS: Attack detection systems (SzA) | §30(2) — measures include technical detection; §39 — KRITIS compliance proof covers detection capabilities. BSI orientation guide for SzA (Systeme zur Angriffserkennung) adds maturity levels |
| 12.12 | BSI request readiness | §33(4) — BSI may request documents and information ("Unterlagen und Auskunfte verlangen"); §39(1) — BSI may request documentation of security measures |

---

## Cross-Reference: Key Legal Provisions

### Overarching Principles (apply to ALL categories)

| Principle | NIS2 | BSIG |
|-----------|------|------|
| Proportionality | Art. 21(1) — "appropriate and proportionate" | §30(1) — "geeignete, verhaltnismassige und wirksame" |
| State of the art | Art. 21(1) — relevant standards | §30(2) sentence 1 — "Stand der Technik einhalten" |
| All-hazards approach | Art. 21(2) — "all-hazards approach" | §30(1) — "Storungen der Verfugbarkeit, Integritat und Vertraulichkeit" |
| Documentation | Art. 21(2)(f) — policies and procedures | §30(1) — "Die Einhaltung ist zu dokumentieren" |
| Corrective action | Art. 21(4) — "adopt corrective measures without undue delay" | §30(1) — ongoing compliance obligation |

### Penalty Provisions (not mapped to individual requirements)

| Entity Type | NIS2 | BSIG |
|-------------|------|------|
| Essential entities | Art. 34(4) — up to EUR 10M or 2% global turnover | §65 BSIG — administrative fines |
| Important entities | Art. 34(5) — up to EUR 7M or 1.4% global turnover | §65 BSIG — administrative fines |
| Management liability | Art. 20(1) — personal liability for infringements | §38(2) — personal liability under corporate law |

---

*Document generated 2026-03-03. Based on NIS2 Directive (EU) 2022/2555 and BSIG 2025 (German BSI Act, effective 2025). Legal provisions may be amended by implementing acts or regulatory guidance.*
