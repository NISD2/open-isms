import { Check, CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignInLink } from "@/components/auth/SignInLink";
import { GetStarted } from "@/components/GetStarted";
import { JsonLd } from "@/components/JsonLd";
import { TalkFirst } from "@/components/pricing/PaidPricingCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { ANNUAL_NET_CENTS, formatWholeEuro } from "@/lib/billing/order";
import { pickLocalized } from "@/lib/locale";
import { articleJsonLd, breadcrumbJsonLd, type Locale, pageAlternates } from "@/lib/seo";

/** What the walk does for the reader, told with the landing page's own words. */
const WALK_POINTS = [
  "walk.steps.oneAtATime",
  "walk.steps.signOff",
  "walk.outcomes.log",
] as const;

/** The paid tier's features as the pricing page lists them. */
const PAID_FEATURES = ["guided", "history", "deadlines", "suppliers", "export"] as const;

type PageContent = {
  meta: { title: string; description: string };
  badge: string;
  title: string;
  subtitle: string;
  intro: string;
  productHeading: string;
  free: string;
  why: { heading: string; bullets: readonly string[] };
  categories: {
    heading: string;
    description: string;
    columns: { tool: string; purpose: string; basis: string };
    rows: readonly { name: string; purpose: string; basis: string }[];
  };
  checklist: {
    heading: string;
    description: string;
    items: readonly { yes: boolean; text: string }[];
  };
  faq: { heading: string; items: readonly { q: string; a: string }[] };
  breadcrumb: string;
};

const listPrice = (locale: string): string => formatWholeEuro(ANNUAL_NET_CENTS, locale);

const content = (price: string): Record<Locale, PageContent> => ({
  de: {
    meta: {
      title: "NIS2 Software für den Mittelstand: Auswahl und Kosten",
      description: `Was eine NIS2 Software können sollte, welche Werkzeuge Sie daneben brauchen und was nisd2.eu kostet: ${price} netto im Jahr, 30 Tage Geld zurück.`,
    },
    badge: "Kaufberatung",
    title: "NIS2 Software: was sie können sollte und was sie kostet",
    subtitle:
      "Welche Funktionen eine NIS2 Software haben sollte, welche Werkzeuge Sie daneben weiter brauchen und was die Software kostet.",
    intro:
      "NIS2 Software unterstützt Unternehmen bei der Umsetzung der EU-Richtlinie NIS 2 (2022/2555) und ihrer nationalen Fassung, in Deutschland dem BSIG. Sie bildet die zehn Maßnahmen aus Artikel 21 Absatz 2 NIS 2 (§ 30 BSIG) ab, dazu die Meldepflichten und die Registrierung bei der Behörde.",
    productHeading: "Was nisd2.eu für Sie tut",
    free: "Kostenlos bleiben die Schulung für die Geschäftsführung und der Selbstbetrieb: derselbe Quellcode (AGPL-3.0) auf Ihren eigenen Servern.",
    why: {
      heading: "Wozu eine NIS2 Software?",
      bullets: [
        "§ 30 Abs. 1 BSIG verlangt, dass Sie die Einhaltung der Maßnahmen dokumentieren. Eine Software hält diese Nachweise an einem Ort.",
        "Erhebliche Sicherheitsvorfälle melden Sie in drei Stufen: frühe Erstmeldung binnen 24 Stunden, Meldung binnen 72 Stunden, Abschlussmeldung einen Monat nach der Meldung (§ 32 BSIG).",
        "Die Geschäftsleitung muss die Maßnahmen umsetzen und ihre Umsetzung überwachen (§ 38 Abs. 1 BSIG). Freigaben in der Software zeigen, wer wann was entschieden hat.",
        "Die zehn Maßnahmen betreffen IT, Einkauf, Personal und Geschäftsleitung. Ein gemeinsames Werkzeug zeigt allen denselben Stand.",
      ],
    },
    categories: {
      heading: "Welche Werkzeuge gehören zu NIS 2?",
      description:
        "Eine NIS2 Software deckt nicht alles ab. Diese Werkzeuge arbeiten meist zusammen:",
      columns: { tool: "Werkzeug", purpose: "Zweck", basis: "Grundlage" },
      rows: [
        {
          name: "GRC-Plattform",
          purpose:
            "Governance, Risiko und Compliance: Maßnahmen, Risiken, Nachweise und Audits an einem Ort.",
          basis: "Dokumentation der Maßnahmen (§ 30 Abs. 1 BSIG)",
        },
        {
          name: "Assetmanagement",
          purpose: "Verzeichnis Ihrer IT-Systeme als Grundlage der Risikoanalyse.",
          basis: "Pflicht (Artikel 21(2)(i) NIS 2)",
        },
        {
          name: "SIEM / Logging",
          purpose: "Erkennung von Sicherheitsereignissen, Forensik.",
          basis: "Sehr empfohlen: meldepflichtige Vorfälle erkennen",
        },
        {
          name: "Patchmanagement",
          purpose: "Updates für Betriebssysteme und Anwendungen nachverfolgen.",
          basis: "Pflicht (Artikel 21(2)(e) NIS 2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Mehrfaktorauthentifizierung, Berechtigungsverwaltung.",
          basis: "Pflicht (Artikel 21(2)(j) NIS 2)",
        },
        {
          name: "Backup und Wiederherstellung",
          purpose: "Datensicherung und die Fähigkeit, Systeme wiederherzustellen.",
          basis: "Pflicht (Artikel 21(2)(c) NIS 2)",
        },
        {
          name: "Lieferantenmanagement",
          purpose: "Bewertung der Cybersicherheit Ihrer Lieferanten.",
          basis: "Pflicht (Artikel 21(2)(d) NIS 2)",
        },
        {
          name: "Schulungsplattform",
          purpose:
            "Schulungen für alle Beschäftigten und für die Geschäftsleitung (§ 38 Abs. 3 BSIG).",
          basis: "Pflicht (Artikel 21(2)(g) NIS 2)",
        },
      ],
    },
    checklist: {
      heading: "Worauf achten beim Kauf einer NIS2 Software?",
      description: "Diese Funktionen sollte eine NIS2 Software abbilden:",
      items: [
        { yes: true, text: "Die zehn Maßnahmen aus Artikel 21 NIS 2 (§ 30 BSIG)" },
        {
          yes: true,
          text: "Meldungen in drei Stufen (24 Stunden, 72 Stunden, ein Monat) nach § 32 BSIG",
        },
        {
          yes: true,
          text: "Registrierungsdaten nach § 33 BSIG mit Verlauf, damit Sie Änderungen rechtzeitig melden",
        },
        {
          yes: true,
          text: "Verlauf: jede Änderung mit Zeitpunkt und verantwortlicher Person",
        },
        {
          yes: true,
          text: "Freigaben der Geschäftsleitung, nachvollziehbar gespeichert",
        },
        { yes: true, text: "Lieferantenverzeichnis mit dem Stand jedes Lieferanten" },
        { yes: true, text: "Mehrere EU-Länder, wenn Sie grenzüberschreitend tätig sind" },
        {
          yes: false,
          text: "Anbieterbindung: Ihre Daten müssen sich vollständig exportieren lassen",
        },
        {
          yes: false,
          text: "Kein öffentlicher Preis: fragen Sie vor dem ersten Termin nach dem Jahrespreis",
        },
      ],
    },
    faq: {
      heading: "Häufige Fragen",
      items: [
        {
          q: "Was kostet eine NIS2 Software?",
          a: `In unserer Prüfung von 150 GRC-Anbietern im Mai 2026 veröffentlichten 120 keinen Preis. nisd2.eu nennt ihn: Der NIS 2 Durchgang kostet ${price} netto im Jahr zzgl. USt., auf Rechnung. Kündigen Sie bei Ihrer ersten Bestellung innerhalb von 30 Tagen, bekommen Sie Ihr Geld zurück. Den offenen Quellcode selbst zu betreiben ist kostenlos.`,
        },
        {
          q: "Reicht Excel?",
          a: "Das Gesetz schreibt kein Werkzeug vor. § 30 Abs. 1 BSIG verlangt, dass Sie die Einhaltung der Maßnahmen dokumentieren, und das geht auch mit Excel. Schwierig wird es, sobald mehrere Personen an der Datei arbeiten und Sie später zeigen wollen, wer wann was geändert oder freigegeben hat. Dafür ist eine Software mit Verlauf gebaut.",
        },
        {
          q: "Reicht eine Software, oder brauche ich mehrere Werkzeuge?",
          a: "Eine NIS2 Software deckt Dokumentation und Nachweise ab. Für SIEM, Patchmanagement, MFA und Backups brauchen Sie weiterhin eigene technische Werkzeuge. Die Nachweise aus diesen Systemen gehören dann in die NIS2 Software.",
        },
        {
          q: "Schreibt NIS 2 eine bestimmte Software vor?",
          a: "Nein. Weder NIS 2 noch das BSIG nennen einen Hersteller. Entscheidend ist, dass Sie die Maßnahmen umsetzen und die Einhaltung dokumentieren. Das geht mit Open Source genauso wie mit gekaufter Software.",
        },
      ],
    },
    breadcrumb: "NIS2 Software",
  },
  en: {
    meta: {
      title: "NIS2 Software: How to Choose It and What It Costs",
      description: `What NIS2 software should do, which tools you still need beside it, and what nisd2.eu costs: ${price} net a year, 30 days money back.`,
    },
    badge: "Buyer's guide",
    title: "NIS2 software: what it should do and what it costs",
    subtitle:
      "Which features NIS2 software should have, which tools you still need beside it, and what the software costs.",
    intro:
      "NIS2 software helps companies implement the EU NIS 2 Directive (2022/2555) and its national transposition, in Germany the BSIG. It covers the ten measures in Article 21(2) NIS 2 (§ 30 BSIG), plus incident reporting and registration with the authority.",
    productHeading: "What nisd2.eu does for you",
    free: "The training for management stays free, and so does self-hosting: the same source code (AGPL-3.0) on your own servers.",
    why: {
      heading: "Why use NIS2 software?",
      bullets: [
        "§ 30(1) BSIG requires you to document that you comply with the measures. Software keeps that evidence in one place.",
        "Significant incidents are reported in three stages: early warning within 24 hours, notification within 72 hours, final report one month after the notification (§ 32 BSIG).",
        "Management must implement the measures and oversee their implementation (§ 38(1) BSIG). Sign-offs in the software show who decided what, and when.",
        "The ten measures involve IT, purchasing, HR and management. One shared tool shows everyone the same status.",
      ],
    },
    categories: {
      heading: "Which tools does NIS 2 involve?",
      description:
        "NIS2 software does not cover everything. These tools usually work together:",
      columns: { tool: "Tool", purpose: "Purpose", basis: "Legal basis" },
      rows: [
        {
          name: "GRC platform",
          purpose:
            "Governance, risk and compliance: measures, risks, evidence and audits in one place.",
          basis: "Documenting the measures (§ 30(1) BSIG)",
        },
        {
          name: "Asset management",
          purpose: "Inventory of your IT systems as the basis for risk analysis.",
          basis: "Mandatory (Article 21(2)(i) NIS 2)",
        },
        {
          name: "SIEM / logging",
          purpose: "Detection of security events, forensics.",
          basis: "Strongly recommended: detect reportable incidents",
        },
        {
          name: "Patch management",
          purpose: "Tracking updates for operating systems and applications.",
          basis: "Mandatory (Article 21(2)(e) NIS 2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Multi-factor authentication, identity and access management.",
          basis: "Mandatory (Article 21(2)(j) NIS 2)",
        },
        {
          name: "Backup and recovery",
          purpose: "Data backup and the ability to restore systems.",
          basis: "Mandatory (Article 21(2)(c) NIS 2)",
        },
        {
          name: "Supplier management",
          purpose: "Cybersecurity assessment of your suppliers.",
          basis: "Mandatory (Article 21(2)(d) NIS 2)",
        },
        {
          name: "Training platform",
          purpose: "Training for all staff and for management (§ 38(3) BSIG).",
          basis: "Mandatory (Article 21(2)(g) NIS 2)",
        },
      ],
    },
    checklist: {
      heading: "What to check before you buy NIS2 software",
      description: "NIS2 software should cover these:",
      items: [
        { yes: true, text: "The ten measures in Article 21 NIS 2 (§ 30 BSIG)" },
        {
          yes: true,
          text: "Incident reports in three stages (24 hours, 72 hours, one month) under § 32 BSIG",
        },
        {
          yes: true,
          text: "Registration data under § 33 BSIG with a history, so you report changes on time",
        },
        {
          yes: true,
          text: "History: every change with its time and the person responsible",
        },
        { yes: true, text: "Management sign-offs, stored so they can be traced" },
        { yes: true, text: "Supplier register with the status of each supplier" },
        { yes: true, text: "Several EU countries, if you operate across borders" },
        { yes: false, text: "Vendor lock-in: you must be able to export all your data" },
        {
          yes: false,
          text: "No public price: ask for the annual price before the first meeting",
        },
      ],
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        {
          q: "What does NIS2 software cost?",
          a: `In our May 2026 audit of 150 GRC vendors, 120 published no price. nisd2.eu publishes it: the NIS 2 walkthrough costs ${price} net a year, plus VAT, by invoice. If you cancel your first order within 30 days, you get your money back. Self-hosting the open source code is free of charge.`,
        },
        {
          q: "Is Excel enough?",
          a: "The law prescribes no tool. § 30(1) BSIG requires you to document compliance with the measures, and Excel can do that. It gets hard once several people edit the file and you later need to show who changed or approved what, and when. That is what software with a history is built for.",
        },
        {
          q: "Is one tool enough, or do I need several?",
          a: "NIS2 software covers documentation and evidence. For SIEM, patch management, MFA and backups you still need separate technical tools. The evidence from those systems then goes into the NIS2 software.",
        },
        {
          q: "Does NIS 2 prescribe a particular software?",
          a: "No. Neither NIS 2 nor the BSIG names a vendor. What matters is that you implement the measures and document compliance. Open source does that as well as bought software.",
        },
      ],
    },
    breadcrumb: "NIS2 Software",
  },
  nl: {
    meta: {
      title: "NIS2 software: hoe kiest u en wat kost het",
      description: `Wat NIS2 software moet kunnen, welke tools u ernaast nog nodig hebt en wat nisd2.eu kost: ${price} netto per jaar, 30 dagen geld terug.`,
    },
    badge: "Koopgids",
    title: "NIS2 software: wat het moet kunnen en wat het kost",
    subtitle:
      "Welke functies NIS2 software nodig heeft, welke tools u ernaast nog nodig hebt en wat de software kost.",
    intro:
      "NIS2 software helpt bedrijven de EU-richtlijn NIS 2 (2022/2555) en de nationale omzetting ervan uit te voeren, in Duitsland de BSIG. Ze dekt de tien maatregelen uit artikel 21, lid 2, NIS 2 (§ 30 BSIG), plus de meldplicht en de registratie bij de autoriteit.",
    productHeading: "Wat nisd2.eu voor u doet",
    free: "De training voor de directie blijft gratis, net als eigen beheer: dezelfde broncode (AGPL-3.0) op uw eigen servers.",
    why: {
      heading: "Waarom NIS2 software?",
      bullets: [
        "§ 30, lid 1, BSIG verplicht u te documenteren dat u de maatregelen naleeft. Software houdt dat bewijs op één plek.",
        "Significante incidenten meldt u in drie stappen: vroegtijdige waarschuwing binnen 24 uur, melding binnen 72 uur, eindverslag een maand na de melding (§ 32 BSIG).",
        "De directie moet de maatregelen uitvoeren en toezien op de uitvoering (§ 38, lid 1, BSIG). Goedkeuringen in de software laten zien wie wat wanneer heeft besloten.",
        "De tien maatregelen raken IT, inkoop, HR en directie. Eén gedeelde tool laat iedereen dezelfde stand zien.",
      ],
    },
    categories: {
      heading: "Welke tools horen bij NIS 2?",
      description: "NIS2 software dekt niet alles. Deze tools werken meestal samen:",
      columns: { tool: "Tool", purpose: "Doel", basis: "Rechtsgrond" },
      rows: [
        {
          name: "GRC-platform",
          purpose:
            "Governance, risico en compliance: maatregelen, risico's, bewijs en audits op één plek.",
          basis: "Documentatie van de maatregelen (§ 30, lid 1, BSIG)",
        },
        {
          name: "Assetbeheer",
          purpose: "Overzicht van uw IT-systemen als basis voor de risicoanalyse.",
          basis: "Verplicht (artikel 21(2)(i) NIS 2)",
        },
        {
          name: "SIEM / logging",
          purpose: "Detectie van beveiligingsgebeurtenissen, forensisch onderzoek.",
          basis: "Sterk aanbevolen: meldplichtige incidenten herkennen",
        },
        {
          name: "Patchbeheer",
          purpose: "Updates voor besturingssystemen en applicaties bijhouden.",
          basis: "Verplicht (artikel 21(2)(e) NIS 2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Meervoudige authenticatie, identiteits- en toegangsbeheer.",
          basis: "Verplicht (artikel 21(2)(j) NIS 2)",
        },
        {
          name: "Back-up en herstel",
          purpose: "Gegevensback-up en het vermogen om systemen te herstellen.",
          basis: "Verplicht (artikel 21(2)(c) NIS 2)",
        },
        {
          name: "Leveranciersbeheer",
          purpose: "Beoordeling van de cyberbeveiliging van uw leveranciers.",
          basis: "Verplicht (artikel 21(2)(d) NIS 2)",
        },
        {
          name: "Trainingsplatform",
          purpose:
            "Training voor alle medewerkers en voor de directie (§ 38, lid 3, BSIG).",
          basis: "Verplicht (artikel 21(2)(g) NIS 2)",
        },
      ],
    },
    checklist: {
      heading: "Waar u op let voordat u NIS2 software koopt",
      description: "NIS2 software moet dit afdekken:",
      items: [
        { yes: true, text: "De tien maatregelen uit artikel 21 NIS 2 (§ 30 BSIG)" },
        {
          yes: true,
          text: "Incidentmeldingen in drie stappen (24 uur, 72 uur, een maand) volgens § 32 BSIG",
        },
        {
          yes: true,
          text: "Registratiegegevens volgens § 33 BSIG met geschiedenis, zodat u wijzigingen op tijd meldt",
        },
        {
          yes: true,
          text: "Geschiedenis: elke wijziging met tijdstip en verantwoordelijke persoon",
        },
        { yes: true, text: "Goedkeuringen door de directie, traceerbaar opgeslagen" },
        { yes: true, text: "Leveranciersregister met de stand van elke leverancier" },
        { yes: true, text: "Meerdere EU-landen, als u grensoverschrijdend werkt" },
        { yes: false, text: "Vendor lock-in: u moet al uw gegevens kunnen exporteren" },
        {
          yes: false,
          text: "Geen openbare prijs: vraag vóór het eerste gesprek naar de jaarprijs",
        },
      ],
    },
    faq: {
      heading: "Veelgestelde vragen",
      items: [
        {
          q: "Wat kost NIS2 software?",
          a: `In onze audit van 150 GRC-leveranciers in mei 2026 publiceerden er 120 geen prijs. nisd2.eu noemt hem wel: de NIS 2 begeleide doorloop kost ${price} netto per jaar, excl. btw, op factuur. Zegt u uw eerste bestelling binnen 30 dagen op, dan krijgt u uw geld terug. De open broncode zelf draaien is gratis.`,
        },
        {
          q: "Is Excel genoeg?",
          a: "De wet schrijft geen tool voor. § 30, lid 1, BSIG verplicht u de naleving van de maatregelen te documenteren, en dat kan ook met Excel. Lastig wordt het zodra meerdere mensen het bestand bewerken en u later moet laten zien wie wat wanneer heeft gewijzigd of goedgekeurd. Daarvoor is software met een geschiedenis gebouwd.",
        },
        {
          q: "Is één tool genoeg, of heb ik er meerdere nodig?",
          a: "NIS2 software dekt documentatie en bewijs. Voor SIEM, patchbeheer, MFA en back-ups hebt u nog steeds aparte technische tools nodig. Het bewijs uit die systemen hoort daarna in de NIS2 software.",
        },
        {
          q: "Schrijft NIS 2 een bepaalde software voor?",
          a: "Nee. NIS 2 noch de BSIG noemt een leverancier. Waar het om gaat, is dat u de maatregelen uitvoert en de naleving documenteert. Dat kan met open source net zo goed als met gekochte software.",
        },
      ],
    },
    breadcrumb: "NIS2 software",
  },
  fr: {
    meta: {
      title: "Logiciel NIS2 : comment le choisir et ce qu'il coûte",
      description: `Ce qu'un logiciel NIS2 doit faire, les outils dont vous avez encore besoin à côté, et le prix de nisd2.eu : ${price} HT par an, remboursé sous 30 jours.`,
    },
    badge: "Guide d'achat",
    title: "Logiciel NIS2 : ce qu'il doit faire et ce qu'il coûte",
    subtitle:
      "Les fonctionnalités dont un logiciel NIS2 a besoin, les outils qu'il vous faut encore à côté, et ce que coûte le logiciel.",
    intro:
      "Un logiciel NIS2 aide les entreprises à mettre en œuvre la directive européenne NIS 2 (2022/2555) et sa transposition nationale, en Allemagne le BSIG. Il couvre les dix mesures de l'article 21, paragraphe 2, NIS 2 (§ 30 BSIG), ainsi que la notification des incidents et l'enregistrement auprès de l'autorité.",
    productHeading: "Ce que nisd2.eu fait pour vous",
    free: "La formation pour la direction reste gratuite, tout comme l'auto-hébergement : le même code source (AGPL-3.0) sur vos propres serveurs.",
    why: {
      heading: "Pourquoi un logiciel NIS2 ?",
      bullets: [
        "Le § 30, al. 1, BSIG vous impose de documenter le respect des mesures. Un logiciel garde ces preuves au même endroit.",
        "Les incidents importants se notifient en trois étapes : alerte précoce sous 24 heures, notification sous 72 heures, rapport final un mois après la notification (§ 32 BSIG).",
        "La direction doit mettre en œuvre les mesures et en surveiller la mise en œuvre (§ 38, al. 1, BSIG). Les validations dans le logiciel montrent qui a décidé quoi, et quand.",
        "Les dix mesures concernent l'informatique, les achats, les RH et la direction. Un outil commun montre à tous le même état d'avancement.",
      ],
    },
    categories: {
      heading: "Quels outils NIS 2 implique-t-elle ?",
      description:
        "Un logiciel NIS2 ne couvre pas tout. Ces outils fonctionnent généralement ensemble :",
      columns: { tool: "Outil", purpose: "Objet", basis: "Base juridique" },
      rows: [
        {
          name: "Plateforme GRC",
          purpose:
            "Gouvernance, risque et conformité : mesures, risques, preuves et audits au même endroit.",
          basis: "Documentation des mesures (§ 30, al. 1, BSIG)",
        },
        {
          name: "Gestion des actifs",
          purpose:
            "Inventaire de vos systèmes informatiques comme base de l'analyse des risques.",
          basis: "Obligatoire (article 21(2)(i) NIS 2)",
        },
        {
          name: "SIEM / journalisation",
          purpose: "Détection des événements de sécurité, criminalistique.",
          basis: "Fortement recommandé : détecter les incidents à notifier",
        },
        {
          name: "Gestion des correctifs",
          purpose:
            "Suivi des mises à jour des systèmes d'exploitation et des applications.",
          basis: "Obligatoire (article 21(2)(e) NIS 2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Authentification multifacteur, gestion des identités et des accès.",
          basis: "Obligatoire (article 21(2)(j) NIS 2)",
        },
        {
          name: "Sauvegarde et restauration",
          purpose: "Sauvegarde des données et capacité à restaurer les systèmes.",
          basis: "Obligatoire (article 21(2)(c) NIS 2)",
        },
        {
          name: "Gestion des fournisseurs",
          purpose: "Évaluation de la cybersécurité de vos fournisseurs.",
          basis: "Obligatoire (article 21(2)(d) NIS 2)",
        },
        {
          name: "Plateforme de formation",
          purpose:
            "Formation pour l'ensemble du personnel et pour la direction (§ 38, al. 3, BSIG).",
          basis: "Obligatoire (article 21(2)(g) NIS 2)",
        },
      ],
    },
    checklist: {
      heading: "Ce qu'il faut vérifier avant d'acheter un logiciel NIS2",
      description: "Un logiciel NIS2 doit couvrir ces points :",
      items: [
        { yes: true, text: "Les dix mesures de l'article 21 NIS 2 (§ 30 BSIG)" },
        {
          yes: true,
          text: "Notification des incidents en trois étapes (24 heures, 72 heures, un mois) au titre du § 32 BSIG",
        },
        {
          yes: true,
          text: "Données d'enregistrement au titre du § 33 BSIG avec historique, pour notifier les changements à temps",
        },
        {
          yes: true,
          text: "Historique : chaque modification avec son heure et la personne responsable",
        },
        {
          yes: true,
          text: "Validations de la direction, conservées de manière traçable",
        },
        {
          yes: true,
          text: "Registre des fournisseurs avec l'état de chaque fournisseur",
        },
        {
          yes: true,
          text: "Plusieurs pays de l'UE, si vous exercez une activité transfrontalière",
        },
        {
          yes: false,
          text: "Verrouillage fournisseur : vous devez pouvoir exporter toutes vos données",
        },
        {
          yes: false,
          text: "Pas de prix public : demandez le prix annuel avant le premier rendez-vous",
        },
      ],
    },
    faq: {
      heading: "Questions fréquentes",
      items: [
        {
          q: "Combien coûte un logiciel NIS2 ?",
          a: `Dans notre audit de 150 fournisseurs GRC en mai 2026, 120 ne publiaient aucun prix. nisd2.eu le publie : le Parcours guidé NIS 2 coûte ${price} HT par an, TVA en sus, sur facture. Si vous résiliez votre première commande dans les 30 jours, vous êtes remboursé. Exploiter vous-même le code source ouvert est gratuit.`,
        },
        {
          q: "Excel suffit-il ?",
          a: "La loi n'impose aucun outil. Le § 30, al. 1, BSIG vous impose de documenter le respect des mesures, et Excel peut le faire. Cela devient difficile dès que plusieurs personnes modifient le fichier et que vous devez montrer plus tard qui a modifié ou validé quoi, et quand. C'est pour cela qu'existe un logiciel avec historique.",
        },
        {
          q: "Un seul outil suffit-il, ou en faut-il plusieurs ?",
          a: "Un logiciel NIS2 couvre la documentation et les preuves. Pour le SIEM, la gestion des correctifs, la MFA et les sauvegardes, il vous faut toujours des outils techniques distincts. Les preuves issues de ces systèmes vont ensuite dans le logiciel NIS2.",
        },
        {
          q: "NIS 2 impose-t-elle un logiciel particulier ?",
          a: "Non. Ni NIS 2 ni le BSIG ne désignent un fournisseur. Ce qui compte, c'est que vous mettiez en œuvre les mesures et que vous documentiez leur respect. L'open source le fait aussi bien qu'un logiciel acheté.",
        },
      ],
    },
    breadcrumb: "Logiciel NIS2",
  },
  it: {
    meta: {
      title: "Software NIS2: come sceglierlo e quanto costa",
      description: `Cosa deve fare un software NIS2, quali strumenti ti servono ancora accanto e quanto costa nisd2.eu: ${price} netti all'anno, rimborso entro 30 giorni.`,
    },
    badge: "Guida all'acquisto",
    title: "Software NIS2: cosa deve fare e quanto costa",
    subtitle:
      "Quali funzionalità servono a un software NIS2, quali strumenti ti servono ancora accanto e quanto costa il software.",
    intro:
      "Un software NIS2 aiuta le aziende ad attuare la direttiva UE NIS 2 (2022/2555) e il suo recepimento nazionale, in Germania il BSIG. Copre le dieci misure dell'articolo 21, paragrafo 2, NIS 2 (§ 30 BSIG), oltre alla notifica degli incidenti e alla registrazione presso l'autorità.",
    productHeading: "Cosa fa nisd2.eu per te",
    free: "La formazione per la direzione resta gratuita, così come il self-hosting: lo stesso codice sorgente (AGPL-3.0) sui tuoi server.",
    why: {
      heading: "Perché un software NIS2?",
      bullets: [
        "Il § 30, comma 1, BSIG ti chiede di documentare il rispetto delle misure. Un software tiene queste prove in un unico posto.",
        "Gli incidenti significativi si notificano in tre fasi: preallarme entro 24 ore, notifica entro 72 ore, relazione finale un mese dopo la notifica (§ 32 BSIG).",
        "La direzione deve attuare le misure e vigilare sulla loro attuazione (§ 38, comma 1, BSIG). Le approvazioni nel software mostrano chi ha deciso cosa, e quando.",
        "Le dieci misure riguardano IT, acquisti, risorse umane e direzione. Uno strumento condiviso mostra a tutti lo stesso stato.",
      ],
    },
    categories: {
      heading: "Quali strumenti riguarda la NIS 2?",
      description:
        "Un software NIS2 non copre tutto. Questi strumenti di solito lavorano insieme:",
      columns: { tool: "Strumento", purpose: "Scopo", basis: "Base giuridica" },
      rows: [
        {
          name: "Piattaforma GRC",
          purpose:
            "Governance, rischio e conformità: misure, rischi, prove e audit in un unico posto.",
          basis: "Documentazione delle misure (§ 30, comma 1, BSIG)",
        },
        {
          name: "Gestione degli asset",
          purpose: "Inventario dei tuoi sistemi IT come base per l'analisi dei rischi.",
          basis: "Obbligatoria (articolo 21(2)(i) NIS 2)",
        },
        {
          name: "SIEM / logging",
          purpose: "Rilevamento degli eventi di sicurezza, analisi forense.",
          basis: "Fortemente consigliato: rilevare gli incidenti da notificare",
        },
        {
          name: "Gestione delle patch",
          purpose:
            "Monitoraggio degli aggiornamenti di sistemi operativi e applicazioni.",
          basis: "Obbligatoria (articolo 21(2)(e) NIS 2)",
        },
        {
          name: "MFA / IAM",
          purpose:
            "Autenticazione a più fattori, gestione delle identità e degli accessi.",
          basis: "Obbligatoria (articolo 21(2)(j) NIS 2)",
        },
        {
          name: "Backup e ripristino",
          purpose: "Backup dei dati e capacità di ripristinare i sistemi.",
          basis: "Obbligatoria (articolo 21(2)(c) NIS 2)",
        },
        {
          name: "Gestione dei fornitori",
          purpose: "Valutazione della cybersicurezza dei tuoi fornitori.",
          basis: "Obbligatoria (articolo 21(2)(d) NIS 2)",
        },
        {
          name: "Piattaforma di formazione",
          purpose:
            "Formazione per tutto il personale e per la direzione (§ 38, comma 3, BSIG).",
          basis: "Obbligatoria (articolo 21(2)(g) NIS 2)",
        },
      ],
    },
    checklist: {
      heading: "Cosa verificare prima di acquistare un software NIS2",
      description: "Un software NIS2 dovrebbe coprire questi punti:",
      items: [
        { yes: true, text: "Le dieci misure dell'articolo 21 NIS 2 (§ 30 BSIG)" },
        {
          yes: true,
          text: "Notifiche degli incidenti in tre fasi (24 ore, 72 ore, un mese) ai sensi del § 32 BSIG",
        },
        {
          yes: true,
          text: "Dati di registrazione ai sensi del § 33 BSIG con cronologia, per notificare in tempo le modifiche",
        },
        {
          yes: true,
          text: "Cronologia: ogni modifica con il momento e la persona responsabile",
        },
        {
          yes: true,
          text: "Approvazioni della direzione, conservate in modo tracciabile",
        },
        { yes: true, text: "Registro dei fornitori con lo stato di ciascun fornitore" },
        { yes: true, text: "Più paesi UE, se operi oltre confine" },
        {
          yes: false,
          text: "Vincolo al fornitore: devi poter esportare tutti i tuoi dati",
        },
        {
          yes: false,
          text: "Nessun prezzo pubblico: chiedi il prezzo annuale prima del primo incontro",
        },
      ],
    },
    faq: {
      heading: "Domande frequenti",
      items: [
        {
          q: "Quanto costa un software NIS2?",
          a: `Nella nostra verifica di 150 fornitori GRC di maggio 2026, 120 non pubblicavano alcun prezzo. nisd2.eu lo pubblica: il Percorso guidato NIS 2 costa ${price} netti all'anno, più IVA, con fattura. Se annulli il tuo primo ordine entro 30 giorni, ricevi il rimborso. Gestire tu stesso il codice sorgente aperto è gratuito.`,
        },
        {
          q: "Basta Excel?",
          a: "La legge non prescrive alcuno strumento. Il § 30, comma 1, BSIG ti chiede di documentare il rispetto delle misure, ed Excel può farlo. Diventa difficile quando più persone modificano il file e in seguito devi mostrare chi ha modificato o approvato cosa, e quando. Per questo esiste un software con cronologia.",
        },
        {
          q: "Basta un solo strumento o ne servono diversi?",
          a: "Un software NIS2 copre la documentazione e le prove. Per SIEM, gestione delle patch, MFA e backup ti servono comunque strumenti tecnici separati. Le prove provenienti da quei sistemi confluiscono poi nel software NIS2.",
        },
        {
          q: "La NIS 2 prescrive un software particolare?",
          a: "No. Né la NIS 2 né il BSIG indicano un fornitore. Ciò che conta è che tu attui le misure e ne documenti il rispetto. L'open source lo fa bene quanto un software acquistato.",
        },
      ],
    },
    breadcrumb: "Software NIS2",
  },
  es: {
    meta: {
      title: "Software NIS2: cómo elegirlo y cuánto cuesta",
      description: `Qué debe hacer un software NIS2, qué herramientas sigue necesitando junto a él y cuánto cuesta nisd2.eu: ${price} netos al año, devolución en 30 días.`,
    },
    badge: "Guía de compra",
    title: "Software NIS2: qué debe hacer y cuánto cuesta",
    subtitle:
      "Qué funciones necesita un software NIS2, qué herramientas sigue necesitando junto a él y cuánto cuesta el software.",
    intro:
      "Un software NIS2 ayuda a las empresas a aplicar la Directiva europea NIS 2 (2022/2555) y su transposición nacional, en Alemania la BSIG. Cubre las diez medidas del artículo 21, apartado 2, NIS 2 (§ 30 BSIG), además de la notificación de incidentes y el registro ante la autoridad.",
    productHeading: "Qué hace nisd2.eu por usted",
    free: "La formación para la dirección sigue siendo gratuita, igual que el autoalojamiento: el mismo código fuente (AGPL-3.0) en sus propios servidores.",
    why: {
      heading: "¿Por qué un software NIS2?",
      bullets: [
        "El § 30, apartado 1, BSIG le exige documentar que cumple las medidas. Un software guarda esas pruebas en un solo lugar.",
        "Los incidentes significativos se notifican en tres fases: alerta temprana en 24 horas, notificación en 72 horas, informe final un mes después de la notificación (§ 32 BSIG).",
        "La dirección debe aplicar las medidas y supervisar su aplicación (§ 38, apartado 1, BSIG). Las aprobaciones en el software muestran quién decidió qué, y cuándo.",
        "Las diez medidas afectan a TI, compras, recursos humanos y dirección. Una herramienta compartida muestra a todos el mismo estado.",
      ],
    },
    categories: {
      heading: "¿Qué herramientas implica NIS 2?",
      description:
        "Un software NIS2 no lo cubre todo. Estas herramientas suelen trabajar juntas:",
      columns: { tool: "Herramienta", purpose: "Finalidad", basis: "Base jurídica" },
      rows: [
        {
          name: "Plataforma GRC",
          purpose:
            "Gobernanza, riesgo y cumplimiento: medidas, riesgos, pruebas y auditorías en un solo lugar.",
          basis: "Documentación de las medidas (§ 30, apartado 1, BSIG)",
        },
        {
          name: "Gestión de activos",
          purpose: "Inventario de sus sistemas de TI como base del análisis de riesgos.",
          basis: "Obligatoria (artículo 21(2)(i) NIS 2)",
        },
        {
          name: "SIEM / registro",
          purpose: "Detección de eventos de seguridad, análisis forense.",
          basis: "Muy recomendable: detectar los incidentes notificables",
        },
        {
          name: "Gestión de parches",
          purpose:
            "Seguimiento de actualizaciones de sistemas operativos y aplicaciones.",
          basis: "Obligatoria (artículo 21(2)(e) NIS 2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Autenticación multifactor, gestión de identidades y accesos.",
          basis: "Obligatoria (artículo 21(2)(j) NIS 2)",
        },
        {
          name: "Copia de seguridad y recuperación",
          purpose: "Copia de seguridad de datos y capacidad de restaurar los sistemas.",
          basis: "Obligatoria (artículo 21(2)(c) NIS 2)",
        },
        {
          name: "Gestión de proveedores",
          purpose: "Evaluación de la ciberseguridad de sus proveedores.",
          basis: "Obligatoria (artículo 21(2)(d) NIS 2)",
        },
        {
          name: "Plataforma de formación",
          purpose:
            "Formación para toda la plantilla y para la dirección (§ 38, apartado 3, BSIG).",
          basis: "Obligatoria (artículo 21(2)(g) NIS 2)",
        },
      ],
    },
    checklist: {
      heading: "Qué comprobar antes de comprar un software NIS2",
      description: "Un software NIS2 debería cubrir estos puntos:",
      items: [
        { yes: true, text: "Las diez medidas del artículo 21 NIS 2 (§ 30 BSIG)" },
        {
          yes: true,
          text: "Notificación de incidentes en tres fases (24 horas, 72 horas, un mes) según el § 32 BSIG",
        },
        {
          yes: true,
          text: "Datos de registro según el § 33 BSIG con historial, para notificar los cambios a tiempo",
        },
        {
          yes: true,
          text: "Historial: cada cambio con su momento y la persona responsable",
        },
        { yes: true, text: "Aprobaciones de la dirección, guardadas de forma trazable" },
        { yes: true, text: "Registro de proveedores con el estado de cada proveedor" },
        { yes: true, text: "Varios países de la UE, si opera de forma transfronteriza" },
        {
          yes: false,
          text: "Dependencia del proveedor: debe poder exportar todos sus datos",
        },
        {
          yes: false,
          text: "Sin precio público: pregunte por el precio anual antes de la primera reunión",
        },
      ],
    },
    faq: {
      heading: "Preguntas frecuentes",
      items: [
        {
          q: "¿Cuánto cuesta un software NIS2?",
          a: `En nuestra auditoría de 150 proveedores GRC de mayo de 2026, 120 no publicaban ningún precio. nisd2.eu lo publica: el Recorrido guiado de NIS 2 cuesta ${price} netos al año, más IVA, con factura. Si cancela su primer pedido en un plazo de 30 días, le devolvemos el dinero. Ejecutar usted mismo el código fuente abierto es gratuito.`,
        },
        {
          q: "¿Basta con Excel?",
          a: "La ley no prescribe ninguna herramienta. El § 30, apartado 1, BSIG le exige documentar el cumplimiento de las medidas, y Excel puede hacerlo. Se complica cuando varias personas editan el archivo y más tarde tiene que mostrar quién cambió o aprobó qué, y cuándo. Para eso existe un software con historial.",
        },
        {
          q: "¿Basta con una herramienta o necesito varias?",
          a: "Un software NIS2 cubre la documentación y las pruebas. Para SIEM, gestión de parches, MFA y copias de seguridad sigue necesitando herramientas técnicas separadas. Las pruebas de esos sistemas pasan después al software NIS2.",
        },
        {
          q: "¿Prescribe NIS 2 un software concreto?",
          a: "No. Ni NIS 2 ni la BSIG nombran a un proveedor. Lo que importa es que aplique las medidas y documente su cumplimiento. El open source lo hace igual de bien que un software comprado.",
        },
      ],
    },
    breadcrumb: "Software NIS2",
  },
  pl: {
    meta: {
      title: "Oprogramowanie NIS2: jak wybrać i ile kosztuje",
      description: `Co powinno robić oprogramowanie NIS2, jakich narzędzi potrzebujesz obok niego i ile kosztuje nisd2.eu: ${price} netto rocznie, 30 dni na zwrot pieniędzy.`,
    },
    badge: "Przewodnik zakupowy",
    title: "Oprogramowanie NIS2: co powinno robić i ile kosztuje",
    subtitle:
      "Jakich funkcji potrzebuje oprogramowanie NIS2, jakich narzędzi nadal potrzebujesz obok niego i ile kosztuje oprogramowanie.",
    intro:
      "Oprogramowanie NIS2 pomaga firmom wdrożyć unijną dyrektywę NIS 2 (2022/2555) i jej krajową transpozycję, w Niemczech BSIG. Obejmuje dziesięć środków z art. 21 ust. 2 NIS 2 (§ 30 BSIG), a także zgłaszanie incydentów i rejestrację u organu.",
    productHeading: "Co nisd2.eu robi dla Ciebie",
    free: "Szkolenie dla zarządu pozostaje bezpłatne, podobnie jak hosting własny: ten sam kod źródłowy (AGPL-3.0) na Twoich własnych serwerach.",
    why: {
      heading: "Po co oprogramowanie NIS2?",
      bullets: [
        "§ 30 ust. 1 BSIG wymaga, abyś dokumentował przestrzeganie środków. Oprogramowanie trzyma te dowody w jednym miejscu.",
        "Poważne incydenty zgłasza się w trzech etapach: wczesne ostrzeżenie w ciągu 24 godzin, zgłoszenie w ciągu 72 godzin, sprawozdanie końcowe miesiąc po zgłoszeniu (§ 32 BSIG).",
        "Kierownictwo musi wdrożyć środki i nadzorować ich wdrażanie (§ 38 ust. 1 BSIG). Zatwierdzenia w oprogramowaniu pokazują, kto, co i kiedy zdecydował.",
        "Dziesięć środków dotyczy IT, zakupów, kadr i kierownictwa. Jedno wspólne narzędzie pokazuje wszystkim ten sam stan.",
      ],
    },
    categories: {
      heading: "Jakich narzędzi dotyczy NIS 2?",
      description:
        "Oprogramowanie NIS2 nie obejmuje wszystkiego. Te narzędzia zwykle działają razem:",
      columns: { tool: "Narzędzie", purpose: "Cel", basis: "Podstawa prawna" },
      rows: [
        {
          name: "Platforma GRC",
          purpose:
            "Ład, ryzyko i zgodność: środki, ryzyka, dowody i audyty w jednym miejscu.",
          basis: "Dokumentowanie środków (§ 30 ust. 1 BSIG)",
        },
        {
          name: "Zarządzanie zasobami",
          purpose: "Spis Twoich systemów IT jako podstawa analizy ryzyka.",
          basis: "Obowiązkowe (art. 21(2)(i) NIS 2)",
        },
        {
          name: "SIEM / rejestrowanie zdarzeń",
          purpose: "Wykrywanie zdarzeń bezpieczeństwa, informatyka śledcza.",
          basis: "Zdecydowanie zalecane: wykrywanie incydentów podlegających zgłoszeniu",
        },
        {
          name: "Zarządzanie poprawkami",
          purpose: "Śledzenie aktualizacji systemów operacyjnych i aplikacji.",
          basis: "Obowiązkowe (art. 21(2)(e) NIS 2)",
        },
        {
          name: "MFA / IAM",
          purpose:
            "Uwierzytelnianie wieloskładnikowe, zarządzanie tożsamością i dostępem.",
          basis: "Obowiązkowe (art. 21(2)(j) NIS 2)",
        },
        {
          name: "Kopie zapasowe i odtwarzanie",
          purpose: "Kopie zapasowe danych i zdolność do odtworzenia systemów.",
          basis: "Obowiązkowe (art. 21(2)(c) NIS 2)",
        },
        {
          name: "Zarządzanie dostawcami",
          purpose: "Ocena cyberbezpieczeństwa Twoich dostawców.",
          basis: "Obowiązkowe (art. 21(2)(d) NIS 2)",
        },
        {
          name: "Platforma szkoleniowa",
          purpose:
            "Szkolenia dla wszystkich pracowników i dla kierownictwa (§ 38 ust. 3 BSIG).",
          basis: "Obowiązkowe (art. 21(2)(g) NIS 2)",
        },
      ],
    },
    checklist: {
      heading: "Co sprawdzić przed zakupem oprogramowania NIS2",
      description: "Oprogramowanie NIS2 powinno obejmować te punkty:",
      items: [
        { yes: true, text: "Dziesięć środków z art. 21 NIS 2 (§ 30 BSIG)" },
        {
          yes: true,
          text: "Zgłaszanie incydentów w trzech etapach (24 godziny, 72 godziny, miesiąc) na mocy § 32 BSIG",
        },
        {
          yes: true,
          text: "Dane rejestracyjne na mocy § 33 BSIG z historią, aby zgłaszać zmiany na czas",
        },
        { yes: true, text: "Historia: każda zmiana z czasem i osobą odpowiedzialną" },
        {
          yes: true,
          text: "Zatwierdzenia kierownictwa, zapisane w sposób możliwy do prześledzenia",
        },
        { yes: true, text: "Rejestr dostawców ze stanem każdego dostawcy" },
        { yes: true, text: "Kilka krajów UE, jeśli działasz transgranicznie" },
        {
          yes: false,
          text: "Uzależnienie od dostawcy: musisz móc wyeksportować wszystkie swoje dane",
        },
        {
          yes: false,
          text: "Brak publicznej ceny: zapytaj o cenę roczną przed pierwszym spotkaniem",
        },
      ],
    },
    faq: {
      heading: "Często zadawane pytania",
      items: [
        {
          q: "Ile kosztuje oprogramowanie NIS2?",
          a: `W naszym audycie 150 dostawców GRC z maja 2026 roku 120 nie publikowało żadnej ceny. nisd2.eu ją podaje: Przewodnik krok po kroku po NIS 2 kosztuje ${price} netto rocznie, plus VAT, na fakturę. Jeśli zrezygnujesz z pierwszego zamówienia w ciągu 30 dni, zwracamy pieniądze. Samodzielne uruchomienie otwartego kodu źródłowego jest bezpłatne.`,
        },
        {
          q: "Czy wystarczy Excel?",
          a: "Prawo nie narzuca żadnego narzędzia. § 30 ust. 1 BSIG wymaga dokumentowania przestrzegania środków, a Excel to potrafi. Trudności zaczynają się, gdy plik edytuje kilka osób, a później musisz pokazać, kto, co i kiedy zmienił lub zatwierdził. Do tego służy oprogramowanie z historią.",
        },
        {
          q: "Czy wystarczy jedno narzędzie, czy potrzebuję kilku?",
          a: "Oprogramowanie NIS2 obejmuje dokumentację i dowody. Do SIEM, zarządzania poprawkami, MFA i kopii zapasowych nadal potrzebujesz osobnych narzędzi technicznych. Dowody z tych systemów trafiają potem do oprogramowania NIS2.",
        },
        {
          q: "Czy NIS 2 narzuca konkretne oprogramowanie?",
          a: "Nie. Ani NIS 2, ani BSIG nie wskazują dostawcy. Liczy się to, czy wdrażasz środki i dokumentujesz ich przestrzeganie. Open source robi to równie dobrze jak kupione oprogramowanie.",
        },
      ],
    },
    breadcrumb: "Oprogramowanie NIS2",
  },
  cs: {
    meta: {
      title: "Software pro NIS2: jak vybrat a kolik stojí",
      description: `Co má umět software pro NIS2, jaké nástroje vedle něj stále potřebujete a kolik stojí nisd2.eu: ${price} bez DPH ročně, 30 dní na vrácení peněz.`,
    },
    badge: "Nákupní průvodce",
    title: "Software pro NIS2: co má umět a kolik stojí",
    subtitle:
      "Jaké funkce software pro NIS2 potřebuje, jaké nástroje vedle něj stále potřebujete a kolik software stojí.",
    intro:
      "Software pro NIS2 pomáhá firmám zavést směrnici EU NIS 2 (2022/2555) a její vnitrostátní provedení, v Německu BSIG. Pokrývá deset opatření z čl. 21 odst. 2 NIS 2 (§ 30 BSIG), k tomu ohlašování incidentů a registraci u příslušného orgánu.",
    productHeading: "Co pro vás nisd2.eu udělá",
    free: "Školení pro vedení zůstává zdarma, stejně jako vlastní provoz: stejný zdrojový kód (AGPL-3.0) na vašich vlastních serverech.",
    why: {
      heading: "Proč software pro NIS2?",
      bullets: [
        "§ 30 odst. 1 BSIG vyžaduje, abyste dokumentovali dodržování opatření. Software drží tyto doklady na jednom místě.",
        "Významné incidenty se ohlašují ve třech krocích: včasné varování do 24 hodin, oznámení do 72 hodin, závěrečná zpráva měsíc po oznámení (§ 32 BSIG).",
        "Vedení musí opatření zavést a na jejich zavádění dohlížet (§ 38 odst. 1 BSIG). Schválení v softwaru ukazují, kdo co a kdy rozhodl.",
        "Deset opatření se týká IT, nákupu, personálního oddělení a vedení. Jeden společný nástroj ukazuje všem stejný stav.",
      ],
    },
    categories: {
      heading: "Jakých nástrojů se NIS 2 týká?",
      description:
        "Software pro NIS2 nepokryje všechno. Tyto nástroje obvykle fungují společně:",
      columns: { tool: "Nástroj", purpose: "Účel", basis: "Právní základ" },
      rows: [
        {
          name: "Platforma GRC",
          purpose:
            "Governance, riziko a shoda: opatření, rizika, doklady a audity na jednom místě.",
          basis: "Dokumentace opatření (§ 30 odst. 1 BSIG)",
        },
        {
          name: "Správa aktiv",
          purpose: "Soupis vašich IT systémů jako základ analýzy rizik.",
          basis: "Povinná (čl. 21(2)(i) NIS 2)",
        },
        {
          name: "SIEM / protokolování",
          purpose: "Detekce bezpečnostních událostí, forenzní analýza.",
          basis: "Důrazně doporučeno: rozpoznat incidenty podléhající ohlášení",
        },
        {
          name: "Správa záplat",
          purpose: "Sledování aktualizací operačních systémů a aplikací.",
          basis: "Povinná (čl. 21(2)(e) NIS 2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Vícefaktorové ověřování, správa identit a přístupů.",
          basis: "Povinná (čl. 21(2)(j) NIS 2)",
        },
        {
          name: "Zálohování a obnova",
          purpose: "Zálohování dat a schopnost obnovit systémy.",
          basis: "Povinná (čl. 21(2)(c) NIS 2)",
        },
        {
          name: "Správa dodavatelů",
          purpose: "Posouzení kybernetické bezpečnosti vašich dodavatelů.",
          basis: "Povinná (čl. 21(2)(d) NIS 2)",
        },
        {
          name: "Vzdělávací platforma",
          purpose: "Školení pro všechny zaměstnance a pro vedení (§ 38 odst. 3 BSIG).",
          basis: "Povinná (čl. 21(2)(g) NIS 2)",
        },
      ],
    },
    checklist: {
      heading: "Co ověřit před nákupem softwaru pro NIS2",
      description: "Software pro NIS2 by měl pokrýt tyto body:",
      items: [
        { yes: true, text: "Deset opatření z čl. 21 NIS 2 (§ 30 BSIG)" },
        {
          yes: true,
          text: "Ohlašování incidentů ve třech krocích (24 hodin, 72 hodin, jeden měsíc) podle § 32 BSIG",
        },
        {
          yes: true,
          text: "Registrační údaje podle § 33 BSIG s historií, abyste změny ohlásili včas",
        },
        { yes: true, text: "Historie: každá změna s časem a odpovědnou osobou" },
        { yes: true, text: "Schválení vedením, uložená dohledatelně" },
        { yes: true, text: "Seznam dodavatelů se stavem každého dodavatele" },
        { yes: true, text: "Více zemí EU, pokud působíte přeshraničně" },
        {
          yes: false,
          text: "Závislost na dodavateli: musíte mít možnost exportovat všechna svá data",
        },
        {
          yes: false,
          text: "Žádná veřejná cena: zeptejte se na roční cenu před první schůzkou",
        },
      ],
    },
    faq: {
      heading: "Často kladené dotazy",
      items: [
        {
          q: "Kolik stojí software pro NIS2?",
          a: `V naší prověrce 150 dodavatelů GRC z května 2026 nezveřejnilo 120 z nich žádnou cenu. nisd2.eu ji uvádí: Průvodce NIS 2 stojí ${price} ročně plus DPH, na fakturu. Pokud první objednávku zrušíte do 30 dnů, vrátíme vám peníze. Provozovat otevřený zdrojový kód sami je zdarma.`,
        },
        {
          q: "Stačí Excel?",
          a: "Zákon žádný nástroj nepředepisuje. § 30 odst. 1 BSIG vyžaduje dokumentovat dodržování opatření, a to Excel zvládne. Obtížné to začne být, jakmile soubor upravuje více lidí a vy později potřebujete ukázat, kdo co a kdy změnil nebo schválil. Na to je software s historií.",
        },
        {
          q: "Stačí jeden nástroj, nebo jich potřebuji několik?",
          a: "Software pro NIS2 pokrývá dokumentaci a doklady. Pro SIEM, správu záplat, MFA a zálohy stále potřebujete samostatné technické nástroje. Doklady z těchto systémů pak patří do softwaru pro NIS2.",
        },
        {
          q: "Předepisuje NIS 2 konkrétní software?",
          a: "Ne. NIS 2 ani BSIG nejmenují žádného dodavatele. Rozhoduje, zda opatření zavedete a jejich dodržování zdokumentujete. Open source to zvládne stejně dobře jako koupený software.",
        },
      ],
    },
    breadcrumb: "Software pro NIS2",
  },
  pt: {
    meta: {
      title: "Software NIS2: como escolher e quanto custa",
      description: `O que um software NIS2 deve fazer, que ferramentas continua a precisar ao lado dele e quanto custa o nisd2.eu: ${price} sem IVA por ano, reembolso em 30 dias.`,
    },
    badge: "Guia de compra",
    title: "Software NIS2: o que deve fazer e quanto custa",
    subtitle:
      "De que funcionalidades precisa um software NIS2, que ferramentas continua a precisar ao lado dele e quanto custa o software.",
    intro:
      "Um software NIS2 ajuda as empresas a aplicar a Diretiva europeia NIS 2 (2022/2555) e a sua transposição nacional, na Alemanha a BSIG. Cobre as dez medidas do artigo 21.º, n.º 2, NIS 2 (§ 30 BSIG), bem como a notificação de incidentes e o registo junto da autoridade.",
    productHeading: "O que o nisd2.eu faz por si",
    free: "A formação para a administração continua gratuita, tal como o autoalojamento: o mesmo código-fonte (AGPL-3.0) nos seus próprios servidores.",
    why: {
      heading: "Porquê um software NIS2?",
      bullets: [
        "O § 30, n.º 1, BSIG exige que documente o cumprimento das medidas. Um software guarda essas provas num só lugar.",
        "Os incidentes significativos notificam-se em três fases: alerta precoce em 24 horas, notificação em 72 horas, relatório final um mês após a notificação (§ 32 BSIG).",
        "A administração tem de aplicar as medidas e supervisionar a sua aplicação (§ 38, n.º 1, BSIG). As aprovações no software mostram quem decidiu o quê, e quando.",
        "As dez medidas envolvem TI, compras, recursos humanos e administração. Uma ferramenta partilhada mostra a todos o mesmo estado.",
      ],
    },
    categories: {
      heading: "Que ferramentas envolve a NIS 2?",
      description:
        "Um software NIS2 não cobre tudo. Estas ferramentas costumam trabalhar em conjunto:",
      columns: { tool: "Ferramenta", purpose: "Finalidade", basis: "Base jurídica" },
      rows: [
        {
          name: "Plataforma GRC",
          purpose:
            "Governança, risco e conformidade: medidas, riscos, provas e auditorias num só lugar.",
          basis: "Documentação das medidas (§ 30, n.º 1, BSIG)",
        },
        {
          name: "Gestão de ativos",
          purpose: "Inventário dos seus sistemas de TI como base da análise de riscos.",
          basis: "Obrigatória (artigo 21(2)(i) NIS 2)",
        },
        {
          name: "SIEM / registo",
          purpose: "Deteção de eventos de segurança, análise forense.",
          basis: "Fortemente recomendado: detetar os incidentes a notificar",
        },
        {
          name: "Gestão de patches",
          purpose: "Acompanhamento das atualizações de sistemas operativos e aplicações.",
          basis: "Obrigatória (artigo 21(2)(e) NIS 2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Autenticação multifator, gestão de identidades e acessos.",
          basis: "Obrigatória (artigo 21(2)(j) NIS 2)",
        },
        {
          name: "Cópia de segurança e recuperação",
          purpose: "Cópia de segurança de dados e capacidade de restaurar os sistemas.",
          basis: "Obrigatória (artigo 21(2)(c) NIS 2)",
        },
        {
          name: "Gestão de fornecedores",
          purpose: "Avaliação da cibersegurança dos seus fornecedores.",
          basis: "Obrigatória (artigo 21(2)(d) NIS 2)",
        },
        {
          name: "Plataforma de formação",
          purpose:
            "Formação para todo o pessoal e para a administração (§ 38, n.º 3, BSIG).",
          basis: "Obrigatória (artigo 21(2)(g) NIS 2)",
        },
      ],
    },
    checklist: {
      heading: "O que verificar antes de comprar um software NIS2",
      description: "Um software NIS2 deve cobrir estes pontos:",
      items: [
        { yes: true, text: "As dez medidas do artigo 21.º NIS 2 (§ 30 BSIG)" },
        {
          yes: true,
          text: "Notificação de incidentes em três fases (24 horas, 72 horas, um mês) ao abrigo do § 32 BSIG",
        },
        {
          yes: true,
          text: "Dados de registo ao abrigo do § 33 BSIG com histórico, para notificar as alterações a tempo",
        },
        {
          yes: true,
          text: "Histórico: cada alteração com o momento e a pessoa responsável",
        },
        { yes: true, text: "Aprovações da administração, guardadas de forma rastreável" },
        { yes: true, text: "Registo de fornecedores com o estado de cada fornecedor" },
        { yes: true, text: "Vários países da UE, se opera além-fronteiras" },
        {
          yes: false,
          text: "Dependência do fornecedor: tem de poder exportar todos os seus dados",
        },
        {
          yes: false,
          text: "Sem preço público: pergunte pelo preço anual antes da primeira reunião",
        },
      ],
    },
    faq: {
      heading: "Perguntas frequentes",
      items: [
        {
          q: "Quanto custa um software NIS2?",
          a: `Na nossa auditoria de 150 fornecedores GRC de maio de 2026, 120 não publicavam qualquer preço. O nisd2.eu publica-o: o Percurso guiado NIS 2 custa ${price} por ano, mais IVA, por fatura. Se cancelar a sua primeira encomenda no prazo de 30 dias, devolvemos o dinheiro. Executar o código-fonte aberto por conta própria é gratuito.`,
        },
        {
          q: "O Excel basta?",
          a: "A lei não impõe nenhuma ferramenta. O § 30, n.º 1, BSIG exige que documente o cumprimento das medidas, e o Excel consegue fazê-lo. Torna-se difícil quando várias pessoas editam o ficheiro e mais tarde tem de mostrar quem alterou ou aprovou o quê, e quando. É para isso que existe um software com histórico.",
        },
        {
          q: "Basta uma ferramenta ou preciso de várias?",
          a: "Um software NIS2 cobre a documentação e as provas. Para SIEM, gestão de patches, MFA e cópias de segurança continua a precisar de ferramentas técnicas separadas. As provas desses sistemas passam depois para o software NIS2.",
        },
        {
          q: "A NIS 2 impõe um software específico?",
          a: "Não. Nem a NIS 2 nem a BSIG indicam um fornecedor. O que importa é que aplique as medidas e documente o seu cumprimento. O open source fá-lo tão bem como um software comprado.",
        },
      ],
    },
    breadcrumb: "Software NIS2",
  },
  ro: {
    meta: {
      title: "Software NIS2: cum îl alegeți și cât costă",
      description: `Ce trebuie să facă un software NIS2, de ce instrumente mai aveți nevoie alături de el și cât costă nisd2.eu: ${price} net pe an, banii înapoi în 30 de zile.`,
    },
    badge: "Ghid de achiziție",
    title: "Software NIS2: ce trebuie să facă și cât costă",
    subtitle:
      "De ce funcții are nevoie un software NIS2, de ce instrumente mai aveți nevoie alături de el și cât costă software-ul.",
    intro:
      "Un software NIS2 ajută companiile să aplice Directiva UE NIS 2 (2022/2555) și transpunerea sa națională, în Germania BSIG. Acoperă cele zece măsuri din articolul 21 alineatul (2) NIS 2 (§ 30 BSIG), precum și raportarea incidentelor și înregistrarea la autoritate.",
    productHeading: "Ce face nisd2.eu pentru dumneavoastră",
    free: "Instruirea pentru conducere rămâne gratuită, la fel și auto-găzduirea: același cod sursă (AGPL-3.0) pe serverele dumneavoastră.",
    why: {
      heading: "De ce un software NIS2?",
      bullets: [
        "§ 30 alin. (1) BSIG vă cere să documentați respectarea măsurilor. Un software păstrează aceste dovezi într-un singur loc.",
        "Incidentele semnificative se raportează în trei etape: avertizare timpurie în 24 de ore, notificare în 72 de ore, raport final la o lună după notificare (§ 32 BSIG).",
        "Conducerea trebuie să pună în aplicare măsurile și să supravegheze punerea lor în aplicare (§ 38 alin. (1) BSIG). Aprobările din software arată cine a decis ce și când.",
        "Cele zece măsuri privesc IT, achizițiile, resursele umane și conducerea. Un instrument comun arată tuturor aceeași situație.",
      ],
    },
    categories: {
      heading: "Ce instrumente implică NIS 2?",
      description:
        "Un software NIS2 nu acoperă totul. Aceste instrumente lucrează de obicei împreună:",
      columns: { tool: "Instrument", purpose: "Scop", basis: "Temei juridic" },
      rows: [
        {
          name: "Platformă GRC",
          purpose:
            "Guvernanță, risc și conformitate: măsuri, riscuri, dovezi și audituri într-un singur loc.",
          basis: "Documentarea măsurilor (§ 30 alin. (1) BSIG)",
        },
        {
          name: "Gestionarea activelor",
          purpose: "Inventarul sistemelor IT ca bază pentru analiza riscurilor.",
          basis: "Obligatorie (articolul 21(2)(i) NIS 2)",
        },
        {
          name: "SIEM / jurnalizare",
          purpose: "Detectarea evenimentelor de securitate, analiză criminalistică.",
          basis: "Puternic recomandat: detectarea incidentelor care trebuie raportate",
        },
        {
          name: "Gestionarea patchurilor",
          purpose: "Urmărirea actualizărilor pentru sistemele de operare și aplicații.",
          basis: "Obligatorie (articolul 21(2)(e) NIS 2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Autentificare multifactor, gestionarea identităților și a accesului.",
          basis: "Obligatorie (articolul 21(2)(j) NIS 2)",
        },
        {
          name: "Backup și recuperare",
          purpose: "Backupul datelor și capacitatea de a restaura sistemele.",
          basis: "Obligatorie (articolul 21(2)(c) NIS 2)",
        },
        {
          name: "Gestionarea furnizorilor",
          purpose: "Evaluarea securității cibernetice a furnizorilor dumneavoastră.",
          basis: "Obligatorie (articolul 21(2)(d) NIS 2)",
        },
        {
          name: "Platformă de instruire",
          purpose:
            "Instruire pentru întreg personalul și pentru conducere (§ 38 alin. (3) BSIG).",
          basis: "Obligatorie (articolul 21(2)(g) NIS 2)",
        },
      ],
    },
    checklist: {
      heading: "Ce să verificați înainte să cumpărați un software NIS2",
      description: "Un software NIS2 ar trebui să acopere aceste puncte:",
      items: [
        { yes: true, text: "Cele zece măsuri din articolul 21 NIS 2 (§ 30 BSIG)" },
        {
          yes: true,
          text: "Raportarea incidentelor în trei etape (24 de ore, 72 de ore, o lună) conform § 32 BSIG",
        },
        {
          yes: true,
          text: "Date de înregistrare conform § 33 BSIG cu istoric, ca să raportați modificările la timp",
        },
        {
          yes: true,
          text: "Istoric: fiecare modificare cu momentul și persoana responsabilă",
        },
        { yes: true, text: "Aprobările conducerii, păstrate în mod trasabil" },
        { yes: true, text: "Registrul furnizorilor cu situația fiecărui furnizor" },
        { yes: true, text: "Mai multe țări UE, dacă activați transfrontalier" },
        {
          yes: false,
          text: "Dependență de furnizor: trebuie să vă puteți exporta toate datele",
        },
        {
          yes: false,
          text: "Niciun preț public: întrebați de prețul anual înainte de prima întâlnire",
        },
      ],
    },
    faq: {
      heading: "Întrebări frecvente",
      items: [
        {
          q: "Cât costă un software NIS2?",
          a: `În auditul nostru din mai 2026 asupra a 150 de furnizori GRC, 120 nu publicau niciun preț. nisd2.eu îl publică: Parcursul ghidat NIS 2 costă ${price} net pe an, plus TVA, pe bază de factură. Dacă anulați prima comandă în 30 de zile, vă returnăm banii. Rularea pe cont propriu a codului sursă deschis este gratuită.`,
        },
        {
          q: "Este suficient Excel?",
          a: "Legea nu impune niciun instrument. § 30 alin. (1) BSIG vă cere să documentați respectarea măsurilor, iar Excel poate face asta. Devine dificil când mai multe persoane editează fișierul și mai târziu trebuie să arătați cine a modificat sau a aprobat ce și când. Pentru asta există un software cu istoric.",
        },
        {
          q: "Este suficient un singur instrument sau am nevoie de mai multe?",
          a: "Un software NIS2 acoperă documentația și dovezile. Pentru SIEM, gestionarea patchurilor, MFA și backupuri aveți în continuare nevoie de instrumente tehnice separate. Dovezile din aceste sisteme ajung apoi în software-ul NIS2.",
        },
        {
          q: "Impune NIS 2 un anumit software?",
          a: "Nu. Nici NIS 2, nici BSIG nu numesc un furnizor. Contează să puneți în aplicare măsurile și să documentați respectarea lor. Open source face asta la fel de bine ca un software cumpărat.",
        },
      ],
    },
    breadcrumb: "Software NIS2",
  },
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = pickLocalized(content(listPrice(locale)), locale);
  return {
    title: c.meta.title,
    description: c.meta.description,
    alternates: pageAlternates("nis2-tool", locale),
  };
}

export default async function Nis2ToolPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const price = listPrice(locale);
  const c = pickLocalized(content(price), locale);
  const [landing, tiers] = await Promise.all([
    getTranslations({ locale, namespace: "landing" }),
    getTranslations({ locale, namespace: "pricing.tiers" }),
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="space-y-10">
      <JsonLd
        data={articleJsonLd({
          slug: "nis2-tool",
          locale,
          title: c.meta.title,
          description: c.meta.description,
          datePublished: "2026-05-03",
          dateModified: "2026-10-05",
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "NIS2", slug: "" },
            { name: c.breadcrumb, slug: "nis2-tool" },
          ],
          locale,
        )}
      />
      <JsonLd data={faqJsonLd} />

      <header>
        <Badge variant="secondary" className="mb-3">
          {c.badge}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">{c.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{c.subtitle}</p>
        {/* The homepage hero's two ways forward: start alone, or talk to us first. */}
        <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button
            asChild
            size="lg"
            className="h-11 rounded-lg px-5 text-[0.9375rem] font-medium shadow-sm transition-shadow hover:shadow-md"
          >
            <SignInLink query={{ mode: "register" }}>{landing("guided.cta")}</SignInLink>
          </Button>
          <TalkFirst size="button" />
        </div>
      </header>

      <Separator />

      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">{c.intro}</p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">{c.productHeading}</h2>
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,24rem)] lg:items-start">
          <ul className="space-y-6">
            {WALK_POINTS.map((key) => (
              <li key={key} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-semibold">{landing(`${key}.title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {landing(`${key}.text`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <Card>
            <CardHeader>
              <CardTitle>{tiers("paid.name")}</CardTitle>
              <CardDescription>{tiers("paid.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                <span className="text-3xl font-semibold tabular-nums">{price}</span>{" "}
                <span className="text-sm text-muted-foreground">
                  {tiers("paid.priceSub")}
                </span>
              </p>
              <Badge variant="secondary">{tiers("paid.moneyBack")}</Badge>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {tiers("paid.terms")}
              </p>
              <ul className="space-y-2 text-sm">
                {PAID_FEATURES.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{tiers(`paid.features.${feature}`)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground">{c.free}</p>
              <div className="flex flex-col items-start gap-1 text-sm font-medium">
                <Link
                  href="/pricing"
                  className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                >
                  {landing("walk.pricing")}
                </Link>
                <Link
                  href="/training/nis2-ceo"
                  className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                >
                  {landing("guided.trainingCta")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{c.why.heading}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {c.why.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c.categories.heading}</CardTitle>
          <CardDescription>{c.categories.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{c.categories.columns.tool}</TableHead>
                <TableHead>{c.categories.columns.purpose}</TableHead>
                <TableHead>{c.categories.columns.basis}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {c.categories.rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="whitespace-normal text-sm text-muted-foreground">
                    {row.purpose}
                  </TableCell>
                  <TableCell className="whitespace-normal text-sm">{row.basis}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c.checklist.heading}</CardTitle>
          <CardDescription>{c.checklist.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {c.checklist.items.map((item) => (
              <li key={item.text} className="flex gap-2">
                {item.yes ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                )}
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c.faq.heading}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {c.faq.items.map((item) => (
            <div key={item.q}>
              <h3 className="text-sm font-semibold">{item.q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <GetStarted variant="funnel" className="mt-16" />
    </div>
  );
}
