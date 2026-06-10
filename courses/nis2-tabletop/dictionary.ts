import { dictionaryTermSchema, type DictionaryTerm } from "@/lib/training/schemas";
import { z } from "zod";

/**
 * Course-level dictionary for the NIS 2 Tabletop Exercise Training.
 *
 * Each [[term]] marker in lesson content is matched against the `term` field
 * (case-insensitive). Terms typed "defined" are course-specific. Terms typed
 * "vocabulary" are general reference.
 */
const dictionary: DictionaryTerm[] = z.array(dictionaryTermSchema).parse([
  // Core course concepts
  { term: "Tabletop exercise", type: "defined", definition: {
    en: "A meeting where the team talks through a fake crisis scenario, makes the decisions a real crisis would require, and writes down every decision. No real systems are touched and no real notifications go out.",
    de: "Eine Besprechung, in der das Team ein fiktives Krisenszenario durchspielt, die in einer echten Krise nötigen Entscheidungen trifft und jede Entscheidung dokumentiert. Keine echten Systeme werden berührt und keine echten Meldungen gehen raus.",
  } },
  { term: "Facilitator", type: "defined", definition: {
    en: "The person who runs the exercise. They narrate events, capture decisions, keep time, and stay neutral. They do not play a role in the scenario.",
    de: "Die Person, die die Übung leitet. Sie erzählt Ereignisse, hält Entscheidungen fest, behält die Zeit und bleibt neutral. Sie spielt keine Rolle im Szenario.",
  } },
  { term: "Protocol", type: "defined", definition: {
    en: "The dated document that comes out of the exercise. Contains the decisions, reasons, lessons learned, improvement items, and a management body signature. The auditor reads this, not the room.",
    de: "Das datierte Dokument, das aus der Übung entsteht. Es enthält Entscheidungen, Begründungen, Lessons Learned, Verbesserungspunkte und die Unterschrift der Geschäftsleitung. Das Audit liest das, nicht den Raum.",
  } },
  { term: "Hot wash", type: "defined", definition: {
    en: "The debrief meeting right after the exercise. Same room, same day, around twenty minutes. Four rounds: what went well, what went badly, what surprised us, what needs to change.",
    de: "Die Nachbesprechung direkt nach der Übung. Gleicher Raum, gleicher Tag, etwa zwanzig Minuten. Vier Runden: was gut lief, was nicht funktionierte, was uns überraschte, was sich ändern muss.",
  } },
  { term: "Improvement item", type: "defined", definition: {
    en: "An action item that comes out of the hot wash. Has a description, an owner, a deadline, a link to the Article 21(2) measure it closes a gap in, and a clear done criterion.",
    de: "Ein Maßnahmen-Punkt aus dem Hot Wash. Hat eine Beschreibung, eine verantwortliche Person, eine Frist, einen Bezug zur Maßnahme aus Artikel 21(2), in der er eine Lücke schließt, und ein klares Abschluss-Kriterium.",
  } },
  { term: "Attestation", type: "defined", definition: {
    en: "The dated PDF this course gives you when you finish. Proof of role-specific cybersecurity training under Article 21(2)(g) NIS 2 for the facilitator role. Not the same as management body training under Article 20(2).",
    de: "Die datierte PDF, die der Kurs am Ende ausstellt. Nachweis rollenspezifischer Cybersicherheits-Schulung nach Artikel 21(2)(g) NIS 2 für die Moderationsrolle. Nicht zu verwechseln mit der Schulung der Geschäftsleitung nach Artikel 20(2).",
  } },
  { term: "Attestation quiz", type: "defined", definition: {
    en: "The eight-question final quiz in Lesson 3.1. Pass with 75 percent to unlock the attestation PDF.",
    de: "Das Acht-Fragen-Abschluss-Quiz in Lektion 3.1. Mit 75 Prozent bestanden wird die Bescheinigungs-PDF freigeschaltet.",
  } },
  { term: "Sim-time", type: "defined", definition: {
    en: "Simulated time used during the exercise. Compresses real-world hours into minutes of meeting time. For example, '1 hour real-time = 8 hours sim-time' lets the team walk through a 30-day incident in a few hours.",
    de: "Simulierte Zeit während der Übung. Sie verdichtet echte Stunden in Minuten der Besprechung. Zum Beispiel \"1 Stunde Echtzeit = 8 Stunden Simulationszeit\", damit das Team einen 30-Tage-Vorfall in wenigen Stunden durchspielen kann.",
  } },
  { term: "Exercise flag", type: "defined", definition: {
    en: "A field on the incident record that marks it as a fake one. The platform produces the same protocol shape for fake and real incidents; this flag is the only thing that tells them apart.",
    de: "Ein Feld im Vorfallsdatensatz, das ihn als fiktiv kennzeichnet. Die Plattform erzeugt für fiktive und reale Vorfälle dasselbe Protokollformat; nur dieses Kennzeichen unterscheidet sie.",
  } },

  // Article 23 cascade
  { term: "Significant incident", type: "defined", definition: {
    en: "An incident that has a significant impact on the services your company provides. Article 23(1) NIS 2 sets the duty; CIR 2024/2690 Articles 3 and 4 define the thresholds.",
    de: "Ein Vorfall mit erheblichen Auswirkungen auf die Dienste Ihres Unternehmens. Artikel 23(1) NIS 2 begründet die Pflicht; CIR 2024/2690 Artikel 3 und 4 definieren die Schwellen.",
  } },
  { term: "Early warning", type: "defined", definition: {
    en: "The first report under Article 23(4)(a) NIS 2. Due within 24 hours of becoming aware. Short. States whether the incident looks malicious, whether it might cross borders, and what is known so far.",
    de: "Die erste Meldung nach Artikel 23(4)(a) NIS 2. Fällig innerhalb von 24 Stunden nach Kenntniserlangung. Kurz. Sie nennt, ob der Vorfall böswillig erscheint, ob er grenzüberschreitend wirken könnte und was bisher bekannt ist.",
  } },
  { term: "Incident notification", type: "defined", definition: {
    en: "The fuller report under Article 23(4)(b) NIS 2. Due within 72 hours of becoming aware. Includes an initial severity assessment, indicators of compromise, and impact on services.",
    de: "Die ausführlichere Meldung nach Artikel 23(4)(b) NIS 2. Fällig innerhalb von 72 Stunden nach Kenntniserlangung. Sie enthält eine erste Einschätzung der Schwere, bekannte Kompromittierungsindikatoren und die Auswirkungen auf die Dienste.",
  } },
  { term: "Intermediate report", type: "defined", definition: {
    en: "A status update under Article 23(4)(c) NIS 2 sent on request from the CSIRT. No fixed deadline. You answer when asked.",
    de: "Ein Statusbericht nach Artikel 23(4)(c) NIS 2 auf Anforderung des CSIRT. Keine feste Frist. Sie antworten, wenn gefragt.",
  } },
  { term: "Final report", type: "defined", definition: {
    en: "The detailed report under Article 23(4)(d) NIS 2. Due one month after the incident notification. Covers description, root cause, mitigation, and cross-border impact.",
    de: "Der ausführliche Bericht nach Artikel 23(4)(d) NIS 2. Fällig einen Monat nach der Vorfallsmeldung. Er deckt Beschreibung, Grundursache, Gegenmaßnahmen und grenzüberschreitende Auswirkungen ab.",
  } },
  { term: "Progress report", type: "defined", definition: {
    en: "Used under Article 23(4)(e) NIS 2 when the incident is not yet resolved at the one-month deadline. The final report follows once the incident is closed.",
    de: "Wird nach Artikel 23(4)(e) NIS 2 eingesetzt, wenn der Vorfall nach einem Monat noch nicht beigelegt ist. Der Abschlussbericht folgt, wenn der Vorfall beendet ist.",
  } },
  { term: "CSIRT", type: "vocabulary", definition: {
    en: "Computer Security Incident Response Team. The national body that receives Article 23 reports. In Germany, the CSIRT function sits at the BSI.",
    de: "Computer Security Incident Response Team. Die nationale Stelle, die die Meldungen nach Artikel 23 entgegennimmt. In Deutschland sitzt die CSIRT-Funktion beim BSI.",
  } },
  { term: "Competent authority", type: "vocabulary", definition: {
    en: "The national authority that supervises and enforces NIS 2 in each EU country. In Germany this is the BSI.",
    de: "Die nationale Behörde, die NIS 2 in jedem EU-Land überwacht und durchsetzt. In Deutschland ist das das BSI.",
  } },

  // Standards and regulations
  { term: "CIR 2024/2690", type: "vocabulary", definition: {
    en: "Commission Implementing Regulation (EU) 2024/2690. Spells out technical and methodological requirements for cybersecurity measures for specific digital infrastructure entities.",
    de: "Durchführungsverordnung (EU) 2024/2690 der Kommission. Sie legt technische und methodische Anforderungen an Cybersicherheits-Maßnahmen für bestimmte digitale Infrastruktur-Einrichtungen fest.",
  } },
  { term: "Digital infrastructure entities", type: "vocabulary", definition: {
    en: "The entity types CIR 2024/2690 applies to directly: DNS providers, TLD registries, cloud providers, data centres, CDNs, MSPs, MSSPs, marketplaces, search engines, social networks, trust service providers.",
    de: "Die Einrichtungstypen, für die CIR 2024/2690 unmittelbar gilt: DNS-Anbieter, TLD-Registries, Cloud-Anbieter, Rechenzentren, CDNs, MSPs, MSSPs, Online-Marktplätze, Suchmaschinen, soziale Netzwerke, Vertrauensdienste-Anbieter.",
  } },
  { term: "BSI Standard 200-4", type: "vocabulary", definition: {
    en: "The German BSI's standard on business continuity management. Defines four exercise types (awareness, tabletop, functional, full-scale) and recommends at least annual cadence.",
    de: "Der BSI-Standard zum Notfall- und Krisenmanagement (Business Continuity Management). Er definiert vier Übungstypen (Awareness, Tabletop, Funktionsübung, Vollübung) und empfiehlt mindestens eine Übung pro Jahr.",
  } },
  { term: "Appropriate and proportionate", type: "vocabulary", definition: {
    en: "The standard in Article 21(1) NIS 2 for cybersecurity measures. They must fit the risk and be sized for the entity. A plan you have never tested cannot meet this standard.",
    de: "Der Maßstab in Artikel 21(1) NIS 2 für Cybersicherheits-Maßnahmen. Sie müssen zum Risiko passen und auf die Einrichtung zugeschnitten sein. Ein nie getesteter Plan kann diesen Maßstab nicht erfüllen.",
  } },
  { term: "Article 21(2)(g) NIS 2", type: "vocabulary", definition: {
    en: "The directive paragraph that requires basic cyber hygiene practices and cybersecurity training. The legal basis for the role-specific training this course's attestation covers.",
    de: "Der Richtlinienabschnitt, der grundlegende Cyber-Hygiene-Praktiken und Cybersicherheits-Schulung verlangt. Die rechtliche Grundlage für die rollenspezifische Schulung, die die Bescheinigung dieses Kurses abdeckt.",
  } },

  // People and roles
  { term: "Management body", type: "defined", definition: {
    en: "The leadership team of the company: CEO, managing directors, board members, anyone with executive responsibility under company law. Article 20(1) NIS 2 makes them personally responsible.",
    de: "Die Leitungsebene des Unternehmens: Geschäftsführer, Vorstände, Aufsichtsratsmitglieder, alle Personen mit Leitungsverantwortung nach Gesellschaftsrecht. Artikel 20(1) NIS 2 macht sie persönlich verantwortlich.",
  } },
  { term: "DPO", type: "vocabulary", definition: {
    en: "Data Protection Officer. The role defined in Article 37 GDPR. Strongly recommended at any tabletop where personal data is involved.",
    de: "Datenschutzbeauftragte. Die Rolle nach Artikel 37 DSGVO. Bei jeder Tabletop-Übung mit personenbezogenen Daten dringend empfohlen.",
  } },
  { term: "Personal data", type: "vocabulary", definition: {
    en: "Any information about an identified or identifiable natural person. Defined in Article 4(1) GDPR.",
    de: "Alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen. Definiert in Artikel 4(1) DSGVO.",
  } },

  // Concepts referenced in scenario walkthrough
  { term: "Initial compromise", type: "defined", definition: {
    en: "The earliest point in time when an attacker got into your environment. Ransomware operators often dwell for weeks before they encrypt anything. The right restore point pre-dates this moment, not just the encryption.",
    de: "Der früheste Zeitpunkt, zu dem ein Angreifer in Ihre Umgebung eingedrungen ist. Ransomware-Täterschaft verweilt oft Wochen, bevor verschlüsselt wird. Der richtige Wiederherstellungspunkt liegt vor diesem Moment, nicht nur vor der Verschlüsselung.",
  } },
]);

export default dictionary;
