# Third-party content

This repository refers to laws and standards it does not own. This file records, for each, what
the repository holds of it and on what terms. Nothing here is licensed by this repository's own
licences (`LICENSE`, `packages/*/LICENSE`, `courses/LICENSE`); where a file or a package licence
seems to say otherwise, this file prevails.

## Laws

The NIS 2 Directive (EU) 2022/2555, Commission Implementing Regulation (EU) 2024/2690, the GDPR,
the Cyber Resilience Act, the AI Act and the German and Czech statutes that transpose or
complement them are official texts. The repository cites them, and quotes them where a duty is
shown in the law's own words. Citations follow the official texts on EUR-Lex,
gesetze-im-internet.de and e-Sbírka.

EU legal acts: © European Union, https://eur-lex.europa.eu. They are cited and quoted with the
source acknowledged; this paragraph is that acknowledgement. For the Commission's own documents,
such as Implementing Regulation (EU) 2024/2690, Commission Decision 2011/833/EU allows reuse on
that condition and on condition that the meaning is not distorted (Articles 4 and 6). German statutes are official works without copyright
protection (§ 5(1) UrhG).

## ISO/IEC standards

ISO/IEC 27001:2022 is referred to by clause and control number and by the short title of each
clause and control, so that a requirement can be mapped and found in the standard. The standard's
text is not reproduced.

The numbers, the short titles, and any description in this repository of what a clause or control
asks are excluded from this repository's licences. All rights in the standards remain with ISO and
IEC. A company implementing or certifying against a standard needs the standard itself, from ISO
or a national standards body.

## ENISA mapping table

The links between NIS2 requirements and ISO/IEC 27001:2022 that are marked as an overlap come from
the ISO/IEC 27001:2022 column of ENISA's mapping table for Implementing Regulation (EU) 2024/2690:
ENISA, Technical Implementation Guidance, mapping table version 1.2 (21.08.2025),
https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance, licensed under
CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). The column is held in
`packages/grc-data-model/src/mappings/enisa-iso27001.ts`.

Changes made: only that column is taken; spacing and letter forms in the references are
normalised; each table point is joined to the NIS2 requirements that cite it, giving one link per
pair with a rationale naming the points behind it. ENISA states the table is not a measure of
equivalence, so none of these links carries a sign-off from one framework to the other. The links
marked as the same record are our own assessment, not ENISA's.

## BSI IT-Grundschutz

Identifiers, grades and numbering of the IT-Grundschutz-Kompendium are facts and are held as such
(`packages/grc-data-model/src/schema/control.ts`). The titles of its requirements are the BSI's
text. They are not shipped until the BSI's terms for reuse have been read and recorded here; until
then the interface links to each Baustein instead.
