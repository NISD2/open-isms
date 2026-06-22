import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  pageAlternates,
  articleJsonLd,
  breadcrumbJsonLd,
  type Locale,
} from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { pickLocalized } from "@/lib/locale";

const content: Record<Locale, {
  title: string;
  subtitle: string;
  meta: { title: string; description: string };
  intro: string;
  why: { heading: string; bullets: string[] };
  categories: {
    heading: string;
    description: string;
    rows: { name: string; purpose: string; needed: string }[];
  };
  checklist: { heading: string; description: string; items: { yes: boolean; text: string }[] };
  ourTool: { heading: string; description: string; features: string[]; cta: string; ctaSecondary: string };
  faq: { heading: string; items: { q: string; a: string }[] };
  breadcrumb: string;
}> = {
  de: {
    title: "NIS2 Tool: Buyer's Guide für Compliance-Software",
    subtitle:
      "Welche NIS2-Tools brauchen Sie wirklich, was kostet das, worauf achten, und welche Funktionen sind Pflicht.",
    meta: {
      title: "NIS2 Tool: Buyer's Guide & kostenlose Compliance-Software",
      description:
        "NIS2 Compliance Tool im Vergleich: Welche Funktionen sind Pflicht, was ist optional, was kostet das. Inklusive kostenlose NIS2-Plattform ohne Lock-in.",
    },
    intro:
      "Ein NIS2 Tool ist Software, die Unternehmen bei der Umsetzung der EU-NIS2-Richtlinie (2022/2555) und ihrer nationalen Transposition (in Deutschland: BSIG / NIS2UmsuCG) unterstützt. Es muss die 10 Cybersicherheitsmaßnahmen aus Artikel 21 NIS2 sowie die Meldepflichten und die BSI-Registrierung abbilden.",
    why: {
      heading: "Warum ein NIS2 Tool?",
      bullets: [
        "NIS2 erfordert dauerhafte Audit-Belege. Word-Dokumente reichen nicht.",
        "Das BSI prüft Reaktionszeiten (24h/72h/1 Monat), manuell kaum nachweisbar.",
        "Geschäftsführerhaftung nach §38 BSIG: Sie brauchen den Nachweis, dass Maßnahmen getroffen wurden.",
        "Die 10 Maßnahmen aus Artikel 21 betreffen mehrere Abteilungen. Koordinierte Tools sparen Zeit.",
      ],
    },
    categories: {
      heading: "Welche Arten von NIS2-Tools gibt es?",
      description:
        "Die Tool-Landschaft für NIS2 ist fragmentiert. Eine sinnvolle Kategorisierung:",
      rows: [
        {
          name: "GRC-Plattform",
          purpose:
            "Governance, Risk & Compliance. Bildet alle Maßnahmen, Risiken, Audits ab.",
          needed: "Pflicht für die Dokumentation",
        },
        {
          name: "Asset-Management",
          purpose: "Inventarisierung von IT-Assets als Basis für Risikoanalysen.",
          needed: "Pflicht (RSK 2.2)",
        },
        {
          name: "SIEM / Logging",
          purpose: "Erkennung von Sicherheitsereignissen, Forensik.",
          needed: "Sehr empfohlen: meldepflichtige Vorfälle erkennen",
        },
        {
          name: "Patch-Management",
          purpose: "Tracking von Updates für Betriebssysteme und Anwendungen.",
          needed: "Pflicht (Artikel 21(2)(e) NIS2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Multi-Faktor-Authentifizierung, Berechtigungsverwaltung.",
          needed: "Pflicht (Artikel 21(2)(j) NIS2)",
        },
        {
          name: "Backup / DR",
          purpose: "Datensicherung und Wiederherstellungsfähigkeit.",
          needed: "Pflicht (Artikel 21(2)(c) NIS2)",
        },
        {
          name: "Lieferantenmanagement",
          purpose: "Bewertung der Cybersicherheit Ihrer Zulieferer.",
          needed: "Pflicht (Artikel 21(2)(d) NIS2)",
        },
        {
          name: "Schulungs-Plattform",
          purpose: "Awareness-Training für alle Mitarbeitenden + Geschäftsführung (§38 BSIG).",
          needed: "Pflicht (Artikel 21(2)(g) NIS2)",
        },
      ],
    },
    checklist: {
      heading: "Worauf achten beim NIS2 Tool?",
      description:
        "Diese Funktionen sollte ein NIS2-Compliance-Tool zwingend abbilden:",
      items: [
        { yes: true, text: "Alle 10 Maßnahmen aus Artikel 21 NIS2 / §30 BSIG" },
        { yes: true, text: "Drei-Stufen-Meldekaskade (24h/72h/1 Monat) nach §32 BSIG" },
        { yes: true, text: "BSI-Registrierungsdaten (§33 BSIG) versionsfest" },
        { yes: true, text: "Audit-Trail: jede Änderung mit Zeitstempel und Verantwortlichem" },
        { yes: true, text: "Sign-Off der Geschäftsführung mit eIDAS-konformer Signatur" },
        { yes: true, text: "Lieferanten-Erfassung mit eigenem Compliance-Status" },
        { yes: true, text: "Mehrere EU-Länder bei grenzüberschreitender Tätigkeit" },
        { yes: false, text: "Vendor Lock-in: Daten-Export muss vollständig möglich sein" },
        { yes: false, text: "„Forever Free“ als Marketing. Achtung: oft nur Lockmittel" },
      ],
    },
    ourTool: {
      heading: "Unsere Antwort: nisd2.eu",
      description:
        "Wir betreiben eine kostenlose NIS2-Compliance-Plattform für europäische Unternehmen. Open-Source-orientiert, ohne Lock-in, mit Fokus auf den deutschen Mittelstand und EU-weite Anforderungen.",
      features: [
        "Alle 49 BSIG-Anforderungen abgebildet",
        "Drei-Stufen-Meldekaskade integriert",
        "Audit-Trail dauerhaft nicht löschbar",
        "Geschäftsführerhaftung-Schutz: Sign-Off, Schulungen, Nachweis",
        "Lieferantenportal: Self-Service-Fragebögen",
        "Kostenlos für die Plattform, optional kostenpflichtige Implementierungsbegleitung",
      ],
      cta: "Plattform ansehen",
      ctaSecondary: "Kostenlose Anwendbarkeitsprüfung",
    },
    faq: {
      heading: "Häufige Fragen",
      items: [
        {
          q: "Was kostet ein NIS2 Tool?",
          a: "Kommerzielle GRC-Tools (Vanta, Drata, OneTrust) liegen bei 10.000 bis 60.000 EUR pro Jahr für ein Mittelstand-Unternehmen. nisd2.eu ist kostenlos. Implementierungsbegleitung kostet bei uns ab 500 EUR pro Monat.",
        },
        {
          q: "Brauche ich ein Tool, oder reicht Excel?",
          a: "Excel reicht nicht aus. Das BSI verlangt einen versionsfesten Audit-Trail. Bei Vorfällen müssen Sie nachweisen können, wer wann was geändert hat. Excel-Dateien werden überschrieben. Ein BSI-Auditor wird das beanstanden.",
        },
        {
          q: "Reicht ein einziges Tool oder brauche ich mehrere?",
          a: "Ein GRC-Tool deckt die Dokumentation und Nachweise ab. Für SIEM, Patch-Management, MFA, Backups brauchen Sie weiterhin separate technische Tools. Ein gutes NIS2-Tool integriert Belege aus diesen Systemen.",
        },
        {
          q: "Kann eine kostenlose Plattform NIS2-konform sein?",
          a: "Ja. NIS2 verlangt keinen bestimmten Hersteller. Entscheidend ist, ob die Anforderungen erfüllt und revisionssicher dokumentiert werden. Open-Source- und kostenlose Tools können das genauso gut wie teure SaaS-Lösungen.",
        },
      ],
    },
    breadcrumb: "NIS2 Tool",
  },
  en: {
    title: "NIS2 Tool: Buyer's Guide for Compliance Software",
    subtitle:
      "What NIS2 tools you actually need, what they cost, what to look for, and which features are mandatory under the directive.",
    meta: {
      title: "NIS2 Tool: Buyer's Guide & Free Compliance Software",
      description:
        "NIS2 compliance tool comparison: which features are mandatory, which are optional, what they cost. Includes free EU-wide NIS2 platform with no lock-in.",
    },
    intro:
      "A NIS2 tool is software that helps companies implement the EU NIS2 Directive (2022/2555) and its national transposition (in Germany: BSIG / NIS2UmsuCG). It must support the 10 cybersecurity measures from Article 21 NIS2 plus incident reporting and authority registration.",
    why: {
      heading: "Why use a NIS2 tool?",
      bullets: [
        "NIS2 requires durable audit evidence. Word documents are not enough.",
        "The BSI checks response times (24h / 72h / 1 month), hard to demonstrate manually.",
        "Personal management liability under §38 BSIG: you need proof measures were implemented.",
        "The 10 measures from Article 21 span multiple departments. Coordinated tools save time.",
      ],
    },
    categories: {
      heading: "What types of NIS2 tools exist?",
      description: "The tooling landscape for NIS2 is fragmented. A useful breakdown:",
      rows: [
        {
          name: "GRC platform",
          purpose:
            "Governance, Risk & Compliance. Represents all measures, risks, audits.",
          needed: "Mandatory for documentation",
        },
        {
          name: "Asset management",
          purpose: "IT asset inventory as the basis for risk analysis.",
          needed: "Mandatory (RSK 2.2)",
        },
        {
          name: "SIEM / logging",
          purpose: "Detection of security events, forensics.",
          needed: "Strongly recommended: detect reportable incidents",
        },
        {
          name: "Patch management",
          purpose: "Tracking updates for operating systems and applications.",
          needed: "Mandatory (Article 21(2)(e) NIS2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Multi-factor authentication, identity & access management.",
          needed: "Mandatory (Article 21(2)(j) NIS2)",
        },
        {
          name: "Backup / DR",
          purpose: "Data backup and recovery capability.",
          needed: "Mandatory (Article 21(2)(c) NIS2)",
        },
        {
          name: "Supplier management",
          purpose: "Cybersecurity assessment of your suppliers and partners.",
          needed: "Mandatory (Article 21(2)(d) NIS2)",
        },
        {
          name: "Training platform",
          purpose:
            "Awareness training for all employees + management (§38 BSIG).",
          needed: "Mandatory (Article 21(2)(g) NIS2)",
        },
      ],
    },
    checklist: {
      heading: "What to check in a NIS2 tool",
      description:
        "These features are non-negotiable in any NIS2 compliance tool:",
      items: [
        { yes: true, text: "All 10 measures from Article 21 NIS2 / §30 BSIG" },
        { yes: true, text: "Three-stage incident reporting cascade (24h / 72h / 1 month) under §32 BSIG" },
        { yes: true, text: "BSI registration data (§33 BSIG) version-controlled" },
        { yes: true, text: "Audit trail: every change with timestamp and responsible person" },
        { yes: true, text: "Management sign-off via eIDAS-compliant signature" },
        { yes: true, text: "Supplier inventory with their own compliance status" },
        { yes: true, text: "Multi-country support if you operate across the EU" },
        { yes: false, text: "Vendor lock-in: full data export must be possible" },
        { yes: false, text: "\"Forever free\" as a marketing claim: usually a hook, read the fine print" },
      ],
    },
    ourTool: {
      heading: "Our answer: nisd2.eu",
      description:
        "We run a free NIS2 compliance platform for European companies. Open-source-aligned, no lock-in, focused on the German Mittelstand and EU-wide requirements.",
      features: [
        "All 49 BSIG requirements covered",
        "Three-stage incident reporting cascade built in",
        "Audit trail that cannot be deleted",
        "Management liability protection: sign-off, training, evidence",
        "Supplier portal: self-service questionnaires",
        "Free platform, optional paid implementation guidance",
      ],
      cta: "Explore the platform",
      ctaSecondary: "Free applicability check",
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        {
          q: "What does a NIS2 tool cost?",
          a: "Commercial GRC tools (Vanta, Drata, OneTrust) typically run €10,000 to €60,000 per year for a mid-sized company. nisd2.eu is free. Implementation guidance from us starts at €500 per month.",
        },
        {
          q: "Do I need a tool, or is Excel enough?",
          a: "Excel is not enough. The BSI requires a tamper-evident audit trail. After an incident, you must prove who changed what when. Excel files are overwritten. A BSI auditor will reject this.",
        },
        {
          q: "Is one tool enough, or do I need several?",
          a: "A GRC tool covers documentation and proof. For SIEM, patch management, MFA, backups you still need separate technical tools. A good NIS2 tool integrates evidence from those systems.",
        },
        {
          q: "Can a free platform be NIS2-compliant?",
          a: "Yes. NIS2 doesn't mandate a specific vendor. What matters is whether the requirements are met and documented in an audit-resistant way. Open-source and free tools can do this just as well as expensive SaaS.",
        },
      ],
    },
    breadcrumb: "NIS2 Tool",
  },
  nl: {
    title: "NIS2 Tool: Buyer's Guide for Compliance Software",
    subtitle:
      "What NIS2 tools you actually need, what they cost, what to look for, and which features are mandatory under the directive.",
    meta: {
      title: "NIS2 Tool: Buyer's Guide & Free Compliance Software",
      description:
        "NIS2 compliance tool comparison: which features are mandatory, which are optional, what they cost. Includes free EU-wide NIS2 platform with no lock-in.",
    },
    intro:
      "A NIS2 tool is software that helps companies implement the EU NIS2 Directive (2022/2555) and its national transposition. It must support the 10 cybersecurity measures from Article 21 NIS2 plus incident reporting and authority registration.",
    why: {
      heading: "Why use a NIS2 tool?",
      bullets: [
        "NIS2 requires durable audit evidence. Word documents are not enough.",
        "Authorities check response times (24h / 72h / 1 month), hard to demonstrate manually.",
        "Personal management liability: you need proof measures were implemented.",
        "The 10 measures from Article 21 span multiple departments. Coordinated tools save time.",
      ],
    },
    categories: {
      heading: "What types of NIS2 tools exist?",
      description: "The tooling landscape for NIS2 is fragmented. A useful breakdown:",
      rows: [
        { name: "GRC platform", purpose: "Governance, Risk & Compliance. Represents all measures, risks, audits.", needed: "Mandatory for documentation" },
        { name: "Asset management", purpose: "IT asset inventory as the basis for risk analysis.", needed: "Mandatory" },
        { name: "SIEM / logging", purpose: "Detection of security events, forensics.", needed: "Strongly recommended" },
        { name: "Patch management", purpose: "Tracking updates for OS and applications.", needed: "Mandatory (Article 21(2)(e))" },
        { name: "MFA / IAM", purpose: "Multi-factor authentication, identity & access management.", needed: "Mandatory (Article 21(2)(j))" },
        { name: "Backup / DR", purpose: "Data backup and recovery capability.", needed: "Mandatory (Article 21(2)(c))" },
        { name: "Supplier management", purpose: "Cybersecurity assessment of your suppliers.", needed: "Mandatory (Article 21(2)(d))" },
        { name: "Training platform", purpose: "Awareness training for all employees + management.", needed: "Mandatory (Article 21(2)(g))" },
      ],
    },
    checklist: {
      heading: "What to check in a NIS2 tool",
      description: "These features are non-negotiable in any NIS2 compliance tool:",
      items: [
        { yes: true, text: "All 10 measures from Article 21 NIS2" },
        { yes: true, text: "Three-stage incident reporting cascade (24h / 72h / 1 month)" },
        { yes: true, text: "Authority registration data version-controlled" },
        { yes: true, text: "Audit trail: every change with timestamp and responsible person" },
        { yes: true, text: "Management sign-off via eIDAS-compliant signature" },
        { yes: true, text: "Supplier inventory with their own compliance status" },
        { yes: true, text: "Multi-country support across the EU" },
        { yes: false, text: "Vendor lock-in: full data export must be possible" },
        { yes: false, text: "\"Forever free\" as marketing: read the fine print" },
      ],
    },
    ourTool: {
      heading: "Our answer: nisd2.eu",
      description:
        "We run a free NIS2 compliance platform for European companies. No lock-in, focused on EU-wide requirements.",
      features: [
        "All 49 BSIG requirements covered",
        "Three-stage incident reporting cascade built in",
        "Audit trail that cannot be deleted",
        "Management liability protection: sign-off, training, evidence",
        "Supplier portal: self-service questionnaires",
        "Free platform, optional paid implementation guidance",
      ],
      cta: "Explore the platform",
      ctaSecondary: "Free applicability check",
    },
    faq: {
      heading: "Frequently asked questions",
      items: [
        { q: "What does a NIS2 tool cost?", a: "Commercial GRC tools (Vanta, Drata, OneTrust) run €10,000 to €60,000 per year for a mid-sized company. nisd2.eu is free." },
        { q: "Do I need a tool, or is Excel enough?", a: "Excel is not enough. Authorities require a tamper-evident audit trail. After an incident, you must prove who changed what when." },
        { q: "Is one tool enough, or do I need several?", a: "A GRC tool covers documentation and proof. For SIEM, patch management, MFA, backups you still need separate technical tools." },
        { q: "Can a free platform be NIS2-compliant?", a: "Yes. NIS2 doesn't mandate a specific vendor. What matters is whether the requirements are met and documented." },
      ],
    },
    breadcrumb: "NIS2 Tool",
  },
  fr: {
    title: "Outil NIS2 : guide d'achat pour les logiciels de conformité",
    subtitle:
      "Quels outils NIS2 vous sont réellement nécessaires, ce qu'ils coûtent, à quoi faire attention, et quelles fonctionnalités sont obligatoires au titre de la directive.",
    meta: {
      title: "Outil NIS2 : guide d'achat et logiciel de conformité gratuit",
      description:
        "Comparatif des outils de conformité NIS2 : quelles fonctionnalités sont obligatoires, lesquelles sont optionnelles, ce qu'elles coûtent. Inclut une plateforme NIS2 gratuite à l'échelle de l'UE, sans verrouillage.",
    },
    intro:
      "Un outil NIS2 est un logiciel qui aide les entreprises à mettre en œuvre la directive NIS2 de l'UE (2022/2555) et sa transposition nationale (en Allemagne : BSIG / NIS2UmsuCG). Il doit prendre en charge les 10 mesures de cybersécurité de l'article 21 NIS2, ainsi que la notification des incidents et l'enregistrement auprès de l'autorité.",
    why: {
      heading: "Pourquoi utiliser un outil NIS2 ?",
      bullets: [
        "NIS2 exige des preuves d'audit durables. Les documents Word ne suffisent pas.",
        "Le BSI contrôle les délais de réaction (24h / 72h / 1 mois), difficiles à démontrer manuellement.",
        "Responsabilité personnelle de la direction au titre du §38 BSIG : vous devez prouver que les mesures ont été mises en œuvre.",
        "Les 10 mesures de l'article 21 concernent plusieurs services. Des outils coordonnés font gagner du temps.",
      ],
    },
    categories: {
      heading: "Quels types d'outils NIS2 existent ?",
      description:
        "Le paysage des outils pour NIS2 est fragmenté. Une répartition utile :",
      rows: [
        {
          name: "Plateforme GRC",
          purpose:
            "Gouvernance, risque et conformité. Représente toutes les mesures, risques et audits.",
          needed: "Obligatoire pour la documentation",
        },
        {
          name: "Gestion des actifs",
          purpose: "Inventaire des actifs informatiques comme base de l'analyse des risques.",
          needed: "Obligatoire (RSK 2.2)",
        },
        {
          name: "SIEM / journalisation",
          purpose: "Détection des événements de sécurité, criminalistique.",
          needed: "Fortement recommandé : détecter les incidents à notifier",
        },
        {
          name: "Gestion des correctifs",
          purpose: "Suivi des mises à jour des systèmes d'exploitation et des applications.",
          needed: "Obligatoire (article 21(2)(e) NIS2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Authentification multifacteur, gestion des identités et des accès.",
          needed: "Obligatoire (article 21(2)(j) NIS2)",
        },
        {
          name: "Sauvegarde / reprise après sinistre",
          purpose: "Sauvegarde des données et capacité de restauration.",
          needed: "Obligatoire (article 21(2)(c) NIS2)",
        },
        {
          name: "Gestion des fournisseurs",
          purpose: "Évaluation de la cybersécurité de vos fournisseurs et partenaires.",
          needed: "Obligatoire (article 21(2)(d) NIS2)",
        },
        {
          name: "Plateforme de formation",
          purpose:
            "Sensibilisation pour l'ensemble du personnel et la direction (§38 BSIG).",
          needed: "Obligatoire (article 21(2)(g) NIS2)",
        },
      ],
    },
    checklist: {
      heading: "À quoi faire attention dans un outil NIS2",
      description:
        "Ces fonctionnalités sont incontournables dans tout outil de conformité NIS2 :",
      items: [
        { yes: true, text: "Les 10 mesures de l'article 21 NIS2 / §30 BSIG" },
        { yes: true, text: "Cascade de notification d'incident à trois étapes (24h / 72h / 1 mois) au titre du §32 BSIG" },
        { yes: true, text: "Données d'enregistrement BSI (§33 BSIG) gérées en versions" },
        { yes: true, text: "Piste d'audit : chaque modification avec horodatage et responsable" },
        { yes: true, text: "Validation de la direction par signature conforme à eIDAS" },
        { yes: true, text: "Inventaire des fournisseurs avec leur propre statut de conformité" },
        { yes: true, text: "Prise en charge de plusieurs pays en cas d'activité transfrontalière dans l'UE" },
        { yes: false, text: "Verrouillage fournisseur : l'export complet des données doit être possible" },
        { yes: false, text: "« Gratuit à vie » comme argument marketing : souvent un appât, lisez les petits caractères" },
      ],
    },
    ourTool: {
      heading: "Notre réponse : nisd2.eu",
      description:
        "Nous exploitons une plateforme de conformité NIS2 gratuite pour les entreprises européennes. Orientée open source, sans verrouillage, axée sur le Mittelstand allemand et les exigences à l'échelle de l'UE.",
      features: [
        "Les 49 exigences du BSIG couvertes",
        "Cascade de notification d'incident à trois étapes intégrée",
        "Piste d'audit indélébile",
        "Protection de la responsabilité de la direction : validation, formations, preuves",
        "Portail fournisseurs : questionnaires en libre-service",
        "Plateforme gratuite, accompagnement à la mise en œuvre en option et payant",
      ],
      cta: "Découvrir la plateforme",
      ctaSecondary: "Vérification d'applicabilité gratuite",
    },
    faq: {
      heading: "Questions fréquentes",
      items: [
        {
          q: "Combien coûte un outil NIS2 ?",
          a: "Les outils GRC commerciaux (Vanta, Drata, OneTrust) se situent généralement entre 10 000 et 60 000 EUR par an pour une entreprise de taille moyenne. nisd2.eu est gratuit. Notre accompagnement à la mise en œuvre démarre à 500 EUR par mois.",
        },
        {
          q: "Ai-je besoin d'un outil, ou Excel suffit-il ?",
          a: "Excel ne suffit pas. Le BSI exige une piste d'audit infalsifiable. En cas d'incident, vous devez pouvoir prouver qui a modifié quoi et quand. Les fichiers Excel sont écrasés. Un auditeur du BSI le contestera.",
        },
        {
          q: "Un seul outil suffit-il, ou en faut-il plusieurs ?",
          a: "Un outil GRC couvre la documentation et les preuves. Pour le SIEM, la gestion des correctifs, la MFA et les sauvegardes, vous avez toujours besoin d'outils techniques distincts. Un bon outil NIS2 intègre les preuves issues de ces systèmes.",
        },
        {
          q: "Une plateforme gratuite peut-elle être conforme à NIS2 ?",
          a: "Oui. NIS2 n'impose aucun fournisseur particulier. Ce qui compte, c'est que les exigences soient satisfaites et documentées de manière résistante à l'audit. Les outils open source et gratuits y parviennent aussi bien que les solutions SaaS coûteuses.",
        },
      ],
    },
    breadcrumb: "Outil NIS2",
  },
  it: {
    title: "Strumento NIS2: guida all'acquisto per il software di conformità",
    subtitle:
      "Quali strumenti NIS2 vi servono davvero, quanto costano, a cosa prestare attenzione e quali funzionalità sono obbligatorie ai sensi della direttiva.",
    meta: {
      title: "Strumento NIS2: guida all'acquisto e software di conformità gratuito",
      description:
        "Confronto degli strumenti di conformità NIS2: quali funzionalità sono obbligatorie, quali facoltative, quanto costano. Include una piattaforma NIS2 gratuita a livello UE, senza vincoli.",
    },
    intro:
      "Uno strumento NIS2 è un software che aiuta le aziende ad attuare la direttiva NIS2 dell'UE (2022/2555) e la sua trasposizione nazionale (in Germania: BSIG / NIS2UmsuCG). Deve supportare le 10 misure di cybersicurezza dell'articolo 21 NIS2, oltre alla notifica degli incidenti e alla registrazione presso l'autorità.",
    why: {
      heading: "Perché usare uno strumento NIS2?",
      bullets: [
        "NIS2 richiede prove di audit durature. I documenti Word non bastano.",
        "Il BSI verifica i tempi di risposta (24h / 72h / 1 mese), difficili da dimostrare manualmente.",
        "Responsabilità personale della direzione ai sensi del §38 BSIG: serve la prova che le misure siano state attuate.",
        "Le 10 misure dell'articolo 21 coinvolgono più reparti. Strumenti coordinati fanno risparmiare tempo.",
      ],
    },
    categories: {
      heading: "Quali tipi di strumenti NIS2 esistono?",
      description:
        "Il panorama degli strumenti per NIS2 è frammentato. Una suddivisione utile:",
      rows: [
        {
          name: "Piattaforma GRC",
          purpose:
            "Governance, rischio e conformità. Rappresenta tutte le misure, i rischi e gli audit.",
          needed: "Obbligatoria per la documentazione",
        },
        {
          name: "Gestione degli asset",
          purpose: "Inventario degli asset IT come base per l'analisi dei rischi.",
          needed: "Obbligatoria (RSK 2.2)",
        },
        {
          name: "SIEM / logging",
          purpose: "Rilevamento degli eventi di sicurezza, analisi forense.",
          needed: "Fortemente consigliato: rilevare gli incidenti soggetti a notifica",
        },
        {
          name: "Gestione delle patch",
          purpose: "Monitoraggio degli aggiornamenti per sistemi operativi e applicazioni.",
          needed: "Obbligatoria (articolo 21(2)(e) NIS2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Autenticazione a più fattori, gestione delle identità e degli accessi.",
          needed: "Obbligatoria (articolo 21(2)(j) NIS2)",
        },
        {
          name: "Backup / disaster recovery",
          purpose: "Backup dei dati e capacità di ripristino.",
          needed: "Obbligatoria (articolo 21(2)(c) NIS2)",
        },
        {
          name: "Gestione dei fornitori",
          purpose: "Valutazione della cybersicurezza dei vostri fornitori e partner.",
          needed: "Obbligatoria (articolo 21(2)(d) NIS2)",
        },
        {
          name: "Piattaforma di formazione",
          purpose:
            "Formazione di sensibilizzazione per tutto il personale e la direzione (§38 BSIG).",
          needed: "Obbligatoria (articolo 21(2)(g) NIS2)",
        },
      ],
    },
    checklist: {
      heading: "A cosa prestare attenzione in uno strumento NIS2",
      description:
        "Queste funzionalità sono irrinunciabili in qualsiasi strumento di conformità NIS2:",
      items: [
        { yes: true, text: "Tutte le 10 misure dell'articolo 21 NIS2 / §30 BSIG" },
        { yes: true, text: "Cascata di notifica degli incidenti a tre fasi (24h / 72h / 1 mese) ai sensi del §32 BSIG" },
        { yes: true, text: "Dati di registrazione BSI (§33 BSIG) con controllo delle versioni" },
        { yes: true, text: "Pista di audit: ogni modifica con marca temporale e responsabile" },
        { yes: true, text: "Approvazione della direzione tramite firma conforme a eIDAS" },
        { yes: true, text: "Inventario dei fornitori con il loro stato di conformità" },
        { yes: true, text: "Supporto multipaese in caso di attività transfrontaliera nell'UE" },
        { yes: false, text: "Vincolo del fornitore: l'esportazione completa dei dati deve essere possibile" },
        { yes: false, text: "« Gratis per sempre » come argomento di marketing: spesso un'esca, leggete le clausole in piccolo" },
      ],
    },
    ourTool: {
      heading: "La nostra risposta: nisd2.eu",
      description:
        "Gestiamo una piattaforma di conformità NIS2 gratuita per le aziende europee. Orientata all'open source, senza vincoli, focalizzata sul Mittelstand tedesco e sui requisiti a livello UE.",
      features: [
        "Tutti i 49 requisiti del BSIG coperti",
        "Cascata di notifica degli incidenti a tre fasi integrata",
        "Pista di audit non cancellabile",
        "Protezione della responsabilità della direzione: approvazione, formazione, prove",
        "Portale fornitori: questionari self-service",
        "Piattaforma gratuita, accompagnamento all'attuazione opzionale e a pagamento",
      ],
      cta: "Esplora la piattaforma",
      ctaSecondary: "Verifica di applicabilità gratuita",
    },
    faq: {
      heading: "Domande frequenti",
      items: [
        {
          q: "Quanto costa uno strumento NIS2?",
          a: "Gli strumenti GRC commerciali (Vanta, Drata, OneTrust) si attestano in genere tra 10.000 e 60.000 EUR all'anno per un'azienda di medie dimensioni. nisd2.eu è gratuito. Il nostro accompagnamento all'attuazione parte da 500 EUR al mese.",
        },
        {
          q: "Mi serve uno strumento o basta Excel?",
          a: "Excel non basta. Il BSI richiede una pista di audit a prova di manomissione. Dopo un incidente dovete poter dimostrare chi ha modificato cosa e quando. I file Excel vengono sovrascritti. Un auditor del BSI lo contesterà.",
        },
        {
          q: "Basta un solo strumento o ne servono diversi?",
          a: "Uno strumento GRC copre la documentazione e le prove. Per SIEM, gestione delle patch, MFA e backup servono comunque strumenti tecnici separati. Un buon strumento NIS2 integra le prove provenienti da quei sistemi.",
        },
        {
          q: "Una piattaforma gratuita può essere conforme a NIS2?",
          a: "Sì. NIS2 non impone un fornitore specifico. Ciò che conta è che i requisiti siano soddisfatti e documentati in modo resistente all'audit. Gli strumenti open source e gratuiti possono farlo bene quanto le costose soluzioni SaaS.",
        },
      ],
    },
    breadcrumb: "Strumento NIS2",
  },
  es: {
    title: "Herramienta NIS2: guía de compra para software de cumplimiento",
    subtitle:
      "Qué herramientas NIS2 necesita realmente, cuánto cuestan, en qué fijarse y qué funciones son obligatorias en virtud de la directiva.",
    meta: {
      title: "Herramienta NIS2: guía de compra y software de cumplimiento gratuito",
      description:
        "Comparativa de herramientas de cumplimiento NIS2: qué funciones son obligatorias, cuáles opcionales y cuánto cuestan. Incluye una plataforma NIS2 gratuita a escala de la UE, sin dependencia del proveedor.",
    },
    intro:
      "Una herramienta NIS2 es un software que ayuda a las empresas a aplicar la Directiva NIS2 de la UE (2022/2555) y su transposición nacional (en Alemania: BSIG / NIS2UmsuCG). Debe cubrir las 10 medidas de ciberseguridad del artículo 21 NIS2, además de la notificación de incidentes y el registro ante la autoridad.",
    why: {
      heading: "¿Por qué usar una herramienta NIS2?",
      bullets: [
        "NIS2 exige pruebas de auditoría duraderas. Los documentos de Word no bastan.",
        "El BSI comprueba los plazos de respuesta (24h / 72h / 1 mes), difíciles de demostrar manualmente.",
        "Responsabilidad personal de la dirección en virtud del §38 BSIG: necesita la prueba de que se aplicaron las medidas.",
        "Las 10 medidas del artículo 21 afectan a varios departamentos. Unas herramientas coordinadas ahorran tiempo.",
      ],
    },
    categories: {
      heading: "¿Qué tipos de herramientas NIS2 existen?",
      description:
        "El panorama de herramientas para NIS2 está fragmentado. Una clasificación útil:",
      rows: [
        {
          name: "Plataforma GRC",
          purpose:
            "Gobernanza, riesgo y cumplimiento. Representa todas las medidas, riesgos y auditorías.",
          needed: "Obligatoria para la documentación",
        },
        {
          name: "Gestión de activos",
          purpose: "Inventario de activos de TI como base del análisis de riesgos.",
          needed: "Obligatoria (RSK 2.2)",
        },
        {
          name: "SIEM / registro",
          purpose: "Detección de eventos de seguridad, análisis forense.",
          needed: "Muy recomendable: detectar los incidentes notificables",
        },
        {
          name: "Gestión de parches",
          purpose: "Seguimiento de actualizaciones de sistemas operativos y aplicaciones.",
          needed: "Obligatoria (artículo 21(2)(e) NIS2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Autenticación multifactor, gestión de identidades y accesos.",
          needed: "Obligatoria (artículo 21(2)(j) NIS2)",
        },
        {
          name: "Copia de seguridad / recuperación ante desastres",
          purpose: "Copia de seguridad de datos y capacidad de recuperación.",
          needed: "Obligatoria (artículo 21(2)(c) NIS2)",
        },
        {
          name: "Gestión de proveedores",
          purpose: "Evaluación de la ciberseguridad de sus proveedores y socios.",
          needed: "Obligatoria (artículo 21(2)(d) NIS2)",
        },
        {
          name: "Plataforma de formación",
          purpose:
            "Formación de concienciación para toda la plantilla y la dirección (§38 BSIG).",
          needed: "Obligatoria (artículo 21(2)(g) NIS2)",
        },
      ],
    },
    checklist: {
      heading: "En qué fijarse en una herramienta NIS2",
      description:
        "Estas funciones son innegociables en cualquier herramienta de cumplimiento NIS2:",
      items: [
        { yes: true, text: "Las 10 medidas del artículo 21 NIS2 / §30 BSIG" },
        { yes: true, text: "Cascada de notificación de incidentes en tres fases (24h / 72h / 1 mes) en virtud del §32 BSIG" },
        { yes: true, text: "Datos de registro del BSI (§33 BSIG) con control de versiones" },
        { yes: true, text: "Pista de auditoría: cada cambio con marca de tiempo y responsable" },
        { yes: true, text: "Validación de la dirección mediante firma conforme a eIDAS" },
        { yes: true, text: "Inventario de proveedores con su propio estado de cumplimiento" },
        { yes: true, text: "Compatibilidad multipaís en caso de actividad transfronteriza en la UE" },
        { yes: false, text: "Dependencia del proveedor: la exportación completa de datos debe ser posible" },
        { yes: false, text: "« Gratis para siempre » como reclamo de marketing: a menudo un cebo, lea la letra pequeña" },
      ],
    },
    ourTool: {
      heading: "Nuestra respuesta: nisd2.eu",
      description:
        "Operamos una plataforma de cumplimiento NIS2 gratuita para empresas europeas. Orientada al open source, sin dependencia del proveedor, centrada en el Mittelstand alemán y en los requisitos a escala de la UE.",
      features: [
        "Los 49 requisitos del BSIG cubiertos",
        "Cascada de notificación de incidentes en tres fases integrada",
        "Pista de auditoría imposible de borrar",
        "Protección de la responsabilidad de la dirección: validación, formación, pruebas",
        "Portal de proveedores: cuestionarios de autoservicio",
        "Plataforma gratuita, acompañamiento a la implementación opcional y de pago",
      ],
      cta: "Explorar la plataforma",
      ctaSecondary: "Verificación de aplicabilidad gratuita",
    },
    faq: {
      heading: "Preguntas frecuentes",
      items: [
        {
          q: "¿Cuánto cuesta una herramienta NIS2?",
          a: "Las herramientas GRC comerciales (Vanta, Drata, OneTrust) suelen costar entre 10.000 y 60.000 EUR al año para una empresa mediana. nisd2.eu es gratuito. Nuestro acompañamiento a la implementación arranca en 500 EUR al mes.",
        },
        {
          q: "¿Necesito una herramienta o basta con Excel?",
          a: "Excel no basta. El BSI exige una pista de auditoría a prueba de manipulaciones. Tras un incidente, debe poder demostrar quién cambió qué y cuándo. Los archivos de Excel se sobrescriben. Un auditor del BSI lo objetará.",
        },
        {
          q: "¿Basta con una sola herramienta o necesito varias?",
          a: "Una herramienta GRC cubre la documentación y las pruebas. Para SIEM, gestión de parches, MFA y copias de seguridad sigue necesitando herramientas técnicas separadas. Una buena herramienta NIS2 integra las pruebas procedentes de esos sistemas.",
        },
        {
          q: "¿Puede una plataforma gratuita cumplir con NIS2?",
          a: "Sí. NIS2 no impone un proveedor concreto. Lo que importa es que los requisitos se cumplan y se documenten de forma resistente a la auditoría. Las herramientas open source y gratuitas pueden hacerlo igual de bien que las costosas soluciones SaaS.",
        },
      ],
    },
    breadcrumb: "Herramienta NIS2",
  },
  pl: {
    title: "Narzędzie NIS2: przewodnik zakupowy po oprogramowaniu do zgodności",
    subtitle:
      "Jakich narzędzi NIS2 naprawdę potrzebujesz, ile kosztują, na co zwrócić uwagę i które funkcje są obowiązkowe na mocy dyrektywy.",
    meta: {
      title: "Narzędzie NIS2: przewodnik zakupowy i bezpłatne oprogramowanie do zgodności",
      description:
        "Porównanie narzędzi do zgodności z NIS2: które funkcje są obowiązkowe, które opcjonalne, ile kosztują. Obejmuje bezpłatną platformę NIS2 w skali UE, bez uzależnienia od dostawcy.",
    },
    intro:
      "Narzędzie NIS2 to oprogramowanie, które pomaga firmom wdrożyć unijną dyrektywę NIS2 (2022/2555) oraz jej krajową transpozycję (w Niemczech: BSIG / NIS2UmsuCG). Musi obsługiwać 10 środków cyberbezpieczeństwa z artykułu 21 NIS2, a także zgłaszanie incydentów i rejestrację u organu.",
    why: {
      heading: "Po co używać narzędzia NIS2?",
      bullets: [
        "NIS2 wymaga trwałych dowodów audytowych. Dokumenty Word nie wystarczą.",
        "BSI sprawdza czasy reakcji (24h / 72h / 1 miesiąc), które trudno wykazać ręcznie.",
        "Osobista odpowiedzialność kierownictwa na mocy §38 BSIG: potrzebujesz dowodu, że środki zostały wdrożone.",
        "10 środków z artykułu 21 dotyczy wielu działów. Skoordynowane narzędzia oszczędzają czas.",
      ],
    },
    categories: {
      heading: "Jakie rodzaje narzędzi NIS2 istnieją?",
      description:
        "Krajobraz narzędzi do NIS2 jest rozdrobniony. Przydatny podział:",
      rows: [
        {
          name: "Platforma GRC",
          purpose:
            "Ład, ryzyko i zgodność. Odwzorowuje wszystkie środki, ryzyka i audyty.",
          needed: "Obowiązkowa dla dokumentacji",
        },
        {
          name: "Zarządzanie zasobami",
          purpose: "Inwentaryzacja zasobów IT jako podstawa analizy ryzyka.",
          needed: "Obowiązkowe (RSK 2.2)",
        },
        {
          name: "SIEM / rejestrowanie zdarzeń",
          purpose: "Wykrywanie zdarzeń bezpieczeństwa, informatyka śledcza.",
          needed: "Zdecydowanie zalecane: wykrywanie incydentów podlegających zgłoszeniu",
        },
        {
          name: "Zarządzanie poprawkami",
          purpose: "Śledzenie aktualizacji systemów operacyjnych i aplikacji.",
          needed: "Obowiązkowe (artykuł 21(2)(e) NIS2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Uwierzytelnianie wieloskładnikowe, zarządzanie tożsamością i dostępem.",
          needed: "Obowiązkowe (artykuł 21(2)(j) NIS2)",
        },
        {
          name: "Kopie zapasowe / odtwarzanie po awarii",
          purpose: "Tworzenie kopii zapasowych danych i zdolność odtwarzania.",
          needed: "Obowiązkowe (artykuł 21(2)(c) NIS2)",
        },
        {
          name: "Zarządzanie dostawcami",
          purpose: "Ocena cyberbezpieczeństwa dostawców i partnerów.",
          needed: "Obowiązkowe (artykuł 21(2)(d) NIS2)",
        },
        {
          name: "Platforma szkoleniowa",
          purpose:
            "Szkolenia uświadamiające dla wszystkich pracowników i kierownictwa (§38 BSIG).",
          needed: "Obowiązkowe (artykuł 21(2)(g) NIS2)",
        },
      ],
    },
    checklist: {
      heading: "Na co zwrócić uwagę w narzędziu NIS2",
      description:
        "Te funkcje są nieodzowne w każdym narzędziu do zgodności z NIS2:",
      items: [
        { yes: true, text: "Wszystkie 10 środków z artykułu 21 NIS2 / §30 BSIG" },
        { yes: true, text: "Trzyetapowa kaskada zgłaszania incydentów (24h / 72h / 1 miesiąc) na mocy §32 BSIG" },
        { yes: true, text: "Dane rejestracyjne BSI (§33 BSIG) z kontrolą wersji" },
        { yes: true, text: "Ścieżka audytu: każda zmiana ze znacznikiem czasu i osobą odpowiedzialną" },
        { yes: true, text: "Zatwierdzenie przez kierownictwo podpisem zgodnym z eIDAS" },
        { yes: true, text: "Inwentaryzacja dostawców z ich własnym statusem zgodności" },
        { yes: true, text: "Obsługa wielu krajów w przypadku działalności transgranicznej w UE" },
        { yes: false, text: "Uzależnienie od dostawcy: pełny eksport danych musi być możliwy" },
        { yes: false, text: "„Darmowe na zawsze” jako hasło marketingowe: często przynęta, czytaj drobny druk" },
      ],
    },
    ourTool: {
      heading: "Nasza odpowiedź: nisd2.eu",
      description:
        "Prowadzimy bezpłatną platformę do zgodności z NIS2 dla firm europejskich. Zorientowaną na open source, bez uzależnienia od dostawcy, skupioną na niemieckim Mittelstandzie i wymaganiach w skali UE.",
      features: [
        "Wszystkie 49 wymagań BSIG ujęte",
        "Wbudowana trzyetapowa kaskada zgłaszania incydentów",
        "Ścieżka audytu, której nie można usunąć",
        "Ochrona odpowiedzialności kierownictwa: zatwierdzenia, szkolenia, dowody",
        "Portal dostawców: kwestionariusze samoobsługowe",
        "Bezpłatna platforma, opcjonalne płatne wsparcie przy wdrożeniu",
      ],
      cta: "Zobacz platformę",
      ctaSecondary: "Bezpłatne sprawdzenie zastosowania",
    },
    faq: {
      heading: "Często zadawane pytania",
      items: [
        {
          q: "Ile kosztuje narzędzie NIS2?",
          a: "Komercyjne narzędzia GRC (Vanta, Drata, OneTrust) kosztują zwykle od 10 000 do 60 000 EUR rocznie dla średniej firmy. nisd2.eu jest bezpłatne. Nasze wsparcie przy wdrożeniu zaczyna się od 500 EUR miesięcznie.",
        },
        {
          q: "Czy potrzebuję narzędzia, czy wystarczy Excel?",
          a: "Excel nie wystarczy. BSI wymaga ścieżki audytu odpornej na manipulacje. Po incydencie musisz móc udowodnić, kto, co i kiedy zmienił. Pliki Excela są nadpisywane. Audytor BSI to zakwestionuje.",
        },
        {
          q: "Czy wystarczy jedno narzędzie, czy potrzebuję kilku?",
          a: "Narzędzie GRC obejmuje dokumentację i dowody. Do SIEM, zarządzania poprawkami, MFA i kopii zapasowych nadal potrzebujesz osobnych narzędzi technicznych. Dobre narzędzie NIS2 integruje dowody z tych systemów.",
        },
        {
          q: "Czy bezpłatna platforma może być zgodna z NIS2?",
          a: "Tak. NIS2 nie narzuca konkretnego dostawcy. Liczy się to, czy wymagania są spełnione i udokumentowane w sposób odporny na audyt. Narzędzia open source i bezpłatne radzą sobie z tym równie dobrze jak kosztowne rozwiązania SaaS.",
        },
      ],
    },
    breadcrumb: "Narzędzie NIS2",
  },
  cs: {
    title: "Nástroj NIS2: nákupní průvodce softwarem pro shodu",
    subtitle:
      "Jaké nástroje NIS2 skutečně potřebujete, kolik stojí, na co si dát pozor a které funkce jsou podle směrnice povinné.",
    meta: {
      title: "Nástroj NIS2: nákupní průvodce a bezplatný software pro shodu",
      description:
        "Srovnání nástrojů pro shodu s NIS2: které funkce jsou povinné, které volitelné, kolik stojí. Včetně bezplatné celounijní platformy NIS2 bez závislosti na dodavateli.",
    },
    intro:
      "Nástroj NIS2 je software, který firmám pomáhá zavést směrnici EU NIS2 (2022/2555) a její vnitrostátní transpozici (v Německu: BSIG / NIS2UmsuCG). Musí pokrýt 10 opatření kybernetické bezpečnosti z článku 21 NIS2, ohlašování incidentů a registraci u příslušného orgánu.",
    why: {
      heading: "Proč používat nástroj NIS2?",
      bullets: [
        "NIS2 vyžaduje trvalé auditní důkazy. Wordové dokumenty nestačí.",
        "BSI kontroluje reakční doby (24h / 72h / 1 měsíc), které lze ručně jen těžko doložit.",
        "Osobní odpovědnost vedení podle §38 BSIG: potřebujete doklad, že opatření byla zavedena.",
        "10 opatření z článku 21 se týká více oddělení. Koordinované nástroje šetří čas.",
      ],
    },
    categories: {
      heading: "Jaké typy nástrojů NIS2 existují?",
      description:
        "Prostředí nástrojů pro NIS2 je roztříštěné. Užitečné rozdělení:",
      rows: [
        {
          name: "Platforma GRC",
          purpose:
            "Governance, riziko a shoda. Zachycuje všechna opatření, rizika a audity.",
          needed: "Povinná pro dokumentaci",
        },
        {
          name: "Správa aktiv",
          purpose: "Inventář IT aktiv jako základ pro analýzu rizik.",
          needed: "Povinná (RSK 2.2)",
        },
        {
          name: "SIEM / protokolování",
          purpose: "Detekce bezpečnostních událostí, forenzní analýza.",
          needed: "Důrazně doporučeno: rozpoznat incidenty podléhající ohlášení",
        },
        {
          name: "Správa záplat",
          purpose: "Sledování aktualizací operačních systémů a aplikací.",
          needed: "Povinná (článek 21(2)(e) NIS2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Vícefaktorové ověřování, správa identit a přístupů.",
          needed: "Povinná (článek 21(2)(j) NIS2)",
        },
        {
          name: "Zálohování / obnova po havárii",
          purpose: "Zálohování dat a schopnost obnovy.",
          needed: "Povinná (článek 21(2)(c) NIS2)",
        },
        {
          name: "Správa dodavatelů",
          purpose: "Posouzení kybernetické bezpečnosti vašich dodavatelů a partnerů.",
          needed: "Povinná (článek 21(2)(d) NIS2)",
        },
        {
          name: "Vzdělávací platforma",
          purpose:
            "Osvětové školení pro všechny zaměstnance a vedení (§38 BSIG).",
          needed: "Povinná (článek 21(2)(g) NIS2)",
        },
      ],
    },
    checklist: {
      heading: "Na co si dát pozor u nástroje NIS2",
      description:
        "Tyto funkce jsou v každém nástroji pro shodu s NIS2 nepostradatelné:",
      items: [
        { yes: true, text: "Všech 10 opatření z článku 21 NIS2 / §30 BSIG" },
        { yes: true, text: "Třístupňová kaskáda ohlašování incidentů (24h / 72h / 1 měsíc) podle §32 BSIG" },
        { yes: true, text: "Registrační údaje BSI (§33 BSIG) s verzováním" },
        { yes: true, text: "Auditní stopa: každá změna s časovým razítkem a odpovědnou osobou" },
        { yes: true, text: "Schválení vedením podpisem v souladu s eIDAS" },
        { yes: true, text: "Inventář dodavatelů s jejich vlastním stavem shody" },
        { yes: true, text: "Podpora více zemí při přeshraniční činnosti v EU" },
        { yes: false, text: "Závislost na dodavateli: úplný export dat musí být možný" },
        { yes: false, text: "„Zdarma navždy“ jako marketingové tvrzení: často návnada, čtěte drobné písmo" },
      ],
    },
    ourTool: {
      heading: "Naše odpověď: nisd2.eu",
      description:
        "Provozujeme bezplatnou platformu pro shodu s NIS2 pro evropské firmy. Orientovanou na open source, bez závislosti na dodavateli, zaměřenou na německý Mittelstand a celounijní požadavky.",
      features: [
        "Všech 49 požadavků BSIG pokryto",
        "Integrovaná třístupňová kaskáda ohlašování incidentů",
        "Auditní stopa, kterou nelze smazat",
        "Ochrana odpovědnosti vedení: schválení, školení, důkazy",
        "Portál dodavatelů: samoobslužné dotazníky",
        "Bezplatná platforma, volitelný placený doprovod při zavádění",
      ],
      cta: "Prohlédnout platformu",
      ctaSecondary: "Bezplatná kontrola použitelnosti",
    },
    faq: {
      heading: "Často kladené dotazy",
      items: [
        {
          q: "Kolik stojí nástroj NIS2?",
          a: "Komerční nástroje GRC (Vanta, Drata, OneTrust) se u středně velké firmy obvykle pohybují mezi 10 000 a 60 000 EUR ročně. nisd2.eu je zdarma. Náš doprovod při zavádění začíná na 500 EUR měsíčně.",
        },
        {
          q: "Potřebuji nástroj, nebo stačí Excel?",
          a: "Excel nestačí. BSI vyžaduje auditní stopu odolnou proti manipulaci. Po incidentu musíte doložit, kdo co a kdy změnil. Soubory Excel se přepisují. Auditor BSI to bude rozporovat.",
        },
        {
          q: "Stačí jeden nástroj, nebo jich potřebuji několik?",
          a: "Nástroj GRC pokrývá dokumentaci a důkazy. Pro SIEM, správu záplat, MFA a zálohy stále potřebujete samostatné technické nástroje. Dobrý nástroj NIS2 integruje důkazy z těchto systémů.",
        },
        {
          q: "Může být bezplatná platforma v souladu s NIS2?",
          a: "Ano. NIS2 nepředepisuje konkrétního dodavatele. Rozhodující je, zda jsou požadavky splněny a zdokumentovány způsobem odolným vůči auditu. Open source a bezplatné nástroje to zvládnou stejně dobře jako drahá řešení SaaS.",
        },
      ],
    },
    breadcrumb: "Nástroj NIS2",
  },
  pt: {
    title: "Ferramenta NIS2: guia de compra para software de conformidade",
    subtitle:
      "De que ferramentas NIS2 precisa realmente, quanto custam, a que estar atento e que funcionalidades são obrigatórias ao abrigo da diretiva.",
    meta: {
      title: "Ferramenta NIS2: guia de compra e software de conformidade gratuito",
      description:
        "Comparação de ferramentas de conformidade NIS2: que funcionalidades são obrigatórias, quais são opcionais, quanto custam. Inclui uma plataforma NIS2 gratuita à escala da UE, sem dependência do fornecedor.",
    },
    intro:
      "Uma ferramenta NIS2 é um software que ajuda as empresas a aplicar a Diretiva NIS2 da UE (2022/2555) e a sua transposição nacional (na Alemanha: BSIG / NIS2UmsuCG). Tem de cobrir as 10 medidas de cibersegurança do artigo 21 NIS2, bem como a notificação de incidentes e o registo junto da autoridade.",
    why: {
      heading: "Porquê usar uma ferramenta NIS2?",
      bullets: [
        "A NIS2 exige provas de auditoria duradouras. Os documentos Word não bastam.",
        "O BSI verifica os prazos de resposta (24h / 72h / 1 mês), difíceis de demonstrar manualmente.",
        "Responsabilidade pessoal da direção ao abrigo do §38 BSIG: precisa de prova de que as medidas foram aplicadas.",
        "As 10 medidas do artigo 21 abrangem vários departamentos. Ferramentas coordenadas poupam tempo.",
      ],
    },
    categories: {
      heading: "Que tipos de ferramentas NIS2 existem?",
      description:
        "O panorama de ferramentas para a NIS2 está fragmentado. Uma divisão útil:",
      rows: [
        {
          name: "Plataforma GRC",
          purpose:
            "Governança, risco e conformidade. Representa todas as medidas, riscos e auditorias.",
          needed: "Obrigatória para a documentação",
        },
        {
          name: "Gestão de ativos",
          purpose: "Inventário de ativos de TI como base da análise de riscos.",
          needed: "Obrigatória (RSK 2.2)",
        },
        {
          name: "SIEM / registo",
          purpose: "Deteção de eventos de segurança, análise forense.",
          needed: "Fortemente recomendado: detetar os incidentes sujeitos a notificação",
        },
        {
          name: "Gestão de patches",
          purpose: "Acompanhamento das atualizações de sistemas operativos e aplicações.",
          needed: "Obrigatória (artigo 21(2)(e) NIS2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Autenticação multifator, gestão de identidades e acessos.",
          needed: "Obrigatória (artigo 21(2)(j) NIS2)",
        },
        {
          name: "Cópia de segurança / recuperação de desastres",
          purpose: "Cópia de segurança de dados e capacidade de recuperação.",
          needed: "Obrigatória (artigo 21(2)(c) NIS2)",
        },
        {
          name: "Gestão de fornecedores",
          purpose: "Avaliação da cibersegurança dos seus fornecedores e parceiros.",
          needed: "Obrigatória (artigo 21(2)(d) NIS2)",
        },
        {
          name: "Plataforma de formação",
          purpose:
            "Formação de sensibilização para todo o pessoal e a direção (§38 BSIG).",
          needed: "Obrigatória (artigo 21(2)(g) NIS2)",
        },
      ],
    },
    checklist: {
      heading: "A que estar atento numa ferramenta NIS2",
      description:
        "Estas funcionalidades são incontornáveis em qualquer ferramenta de conformidade NIS2:",
      items: [
        { yes: true, text: "As 10 medidas do artigo 21 NIS2 / §30 BSIG" },
        { yes: true, text: "Cascata de notificação de incidentes em três fases (24h / 72h / 1 mês) ao abrigo do §32 BSIG" },
        { yes: true, text: "Dados de registo do BSI (§33 BSIG) com controlo de versões" },
        { yes: true, text: "Trilho de auditoria: cada alteração com data e hora e responsável" },
        { yes: true, text: "Validação da direção mediante assinatura conforme com eIDAS" },
        { yes: true, text: "Inventário de fornecedores com o seu próprio estado de conformidade" },
        { yes: true, text: "Suporte multipaís em caso de atividade transfronteiriça na UE" },
        { yes: false, text: "Dependência do fornecedor: a exportação completa de dados tem de ser possível" },
        { yes: false, text: "« Gratuito para sempre » como argumento de marketing: muitas vezes um isco, leia as letras pequenas" },
      ],
    },
    ourTool: {
      heading: "A nossa resposta: nisd2.eu",
      description:
        "Operamos uma plataforma de conformidade NIS2 gratuita para empresas europeias. Orientada para o open source, sem dependência do fornecedor, focada no Mittelstand alemão e nos requisitos à escala da UE.",
      features: [
        "Os 49 requisitos do BSIG cobertos",
        "Cascata de notificação de incidentes em três fases integrada",
        "Trilho de auditoria que não pode ser eliminado",
        "Proteção da responsabilidade da direção: validação, formação, provas",
        "Portal de fornecedores: questionários de autosserviço",
        "Plataforma gratuita, acompanhamento à implementação opcional e pago",
      ],
      cta: "Explorar a plataforma",
      ctaSecondary: "Verificação de aplicabilidade gratuita",
    },
    faq: {
      heading: "Perguntas frequentes",
      items: [
        {
          q: "Quanto custa uma ferramenta NIS2?",
          a: "As ferramentas GRC comerciais (Vanta, Drata, OneTrust) situam-se em geral entre 10 000 e 60 000 EUR por ano para uma empresa de média dimensão. O nisd2.eu é gratuito. O nosso acompanhamento à implementação começa em 500 EUR por mês.",
        },
        {
          q: "Preciso de uma ferramenta ou basta o Excel?",
          a: "O Excel não basta. O BSI exige um trilho de auditoria à prova de adulteração. Após um incidente, tem de poder provar quem alterou o quê e quando. Os ficheiros Excel são substituídos. Um auditor do BSI irá contestá-lo.",
        },
        {
          q: "Basta uma única ferramenta ou preciso de várias?",
          a: "Uma ferramenta GRC cobre a documentação e as provas. Para SIEM, gestão de patches, MFA e cópias de segurança continua a precisar de ferramentas técnicas separadas. Uma boa ferramenta NIS2 integra as provas provenientes desses sistemas.",
        },
        {
          q: "Pode uma plataforma gratuita estar em conformidade com a NIS2?",
          a: "Sim. A NIS2 não impõe um fornecedor específico. O que importa é que os requisitos sejam cumpridos e documentados de forma resistente à auditoria. As ferramentas open source e gratuitas conseguem fazê-lo tão bem como as dispendiosas soluções SaaS.",
        },
      ],
    },
    breadcrumb: "Ferramenta NIS2",
  },
  ro: {
    title: "Instrument NIS2: ghid de achiziție pentru software de conformitate",
    subtitle:
      "De ce instrumente NIS2 aveți nevoie cu adevărat, cât costă, la ce să fiți atenți și ce funcții sunt obligatorii în temeiul directivei.",
    meta: {
      title: "Instrument NIS2: ghid de achiziție și software de conformitate gratuit",
      description:
        "Comparație a instrumentelor de conformitate NIS2: ce funcții sunt obligatorii, care sunt opționale, cât costă. Include o platformă NIS2 gratuită la nivelul UE, fără dependență de furnizor.",
    },
    intro:
      "Un instrument NIS2 este un software care ajută companiile să pună în aplicare Directiva NIS2 a UE (2022/2555) și transpunerea sa națională (în Germania: BSIG / NIS2UmsuCG). Trebuie să acopere cele 10 măsuri de securitate cibernetică din articolul 21 NIS2, precum și raportarea incidentelor și înregistrarea la autoritate.",
    why: {
      heading: "De ce să folosiți un instrument NIS2?",
      bullets: [
        "NIS2 impune dovezi de audit durabile. Documentele Word nu sunt suficiente.",
        "BSI verifică timpii de răspuns (24h / 72h / 1 lună), greu de demonstrat manual.",
        "Răspunderea personală a conducerii în temeiul §38 BSIG: aveți nevoie de dovada că măsurile au fost puse în aplicare.",
        "Cele 10 măsuri din articolul 21 vizează mai multe departamente. Instrumentele coordonate economisesc timp.",
      ],
    },
    categories: {
      heading: "Ce tipuri de instrumente NIS2 există?",
      description:
        "Peisajul instrumentelor pentru NIS2 este fragmentat. O împărțire utilă:",
      rows: [
        {
          name: "Platformă GRC",
          purpose:
            "Guvernanță, risc și conformitate. Reprezintă toate măsurile, riscurile și auditurile.",
          needed: "Obligatorie pentru documentație",
        },
        {
          name: "Gestionarea activelor",
          purpose: "Inventarul activelor IT ca bază pentru analiza riscurilor.",
          needed: "Obligatorie (RSK 2.2)",
        },
        {
          name: "SIEM / jurnalizare",
          purpose: "Detectarea evenimentelor de securitate, analiză criminalistică.",
          needed: "Puternic recomandat: detectarea incidentelor care trebuie raportate",
        },
        {
          name: "Gestionarea patchurilor",
          purpose: "Urmărirea actualizărilor pentru sistemele de operare și aplicații.",
          needed: "Obligatorie (articolul 21(2)(e) NIS2)",
        },
        {
          name: "MFA / IAM",
          purpose: "Autentificare multifactor, gestionarea identităților și a accesului.",
          needed: "Obligatorie (articolul 21(2)(j) NIS2)",
        },
        {
          name: "Backup / recuperare în caz de dezastru",
          purpose: "Backupul datelor și capacitatea de recuperare.",
          needed: "Obligatorie (articolul 21(2)(c) NIS2)",
        },
        {
          name: "Gestionarea furnizorilor",
          purpose: "Evaluarea securității cibernetice a furnizorilor și partenerilor dumneavoastră.",
          needed: "Obligatorie (articolul 21(2)(d) NIS2)",
        },
        {
          name: "Platformă de formare",
          purpose:
            "Formare de conștientizare pentru întreg personalul și conducere (§38 BSIG).",
          needed: "Obligatorie (articolul 21(2)(g) NIS2)",
        },
      ],
    },
    checklist: {
      heading: "La ce să fiți atenți la un instrument NIS2",
      description:
        "Aceste funcții sunt indispensabile în orice instrument de conformitate NIS2:",
      items: [
        { yes: true, text: "Cele 10 măsuri din articolul 21 NIS2 / §30 BSIG" },
        { yes: true, text: "Cascadă de raportare a incidentelor în trei etape (24h / 72h / 1 lună) în temeiul §32 BSIG" },
        { yes: true, text: "Date de înregistrare BSI (§33 BSIG) cu control al versiunilor" },
        { yes: true, text: "Pistă de audit: fiecare modificare cu marcaj temporal și persoană responsabilă" },
        { yes: true, text: "Aprobarea conducerii prin semnătură conformă cu eIDAS" },
        { yes: true, text: "Inventarul furnizorilor cu propriul lor stadiu de conformitate" },
        { yes: true, text: "Suport pentru mai multe țări în cazul activității transfrontaliere în UE" },
        { yes: false, text: "Dependență de furnizor: exportul complet al datelor trebuie să fie posibil" },
        { yes: false, text: "« Gratuit pentru totdeauna » ca argument de marketing: adesea o momeală, citiți literele mici" },
      ],
    },
    ourTool: {
      heading: "Răspunsul nostru: nisd2.eu",
      description:
        "Operăm o platformă de conformitate NIS2 gratuită pentru companiile europene. Orientată spre open source, fără dependență de furnizor, axată pe Mittelstandul german și pe cerințele la nivelul UE.",
      features: [
        "Toate cele 49 de cerințe BSIG acoperite",
        "Cascadă de raportare a incidentelor în trei etape integrată",
        "Pistă de audit care nu poate fi ștearsă",
        "Protecția răspunderii conducerii: aprobare, formare, dovezi",
        "Portal pentru furnizori: chestionare cu autoservire",
        "Platformă gratuită, acompaniere la implementare opțională și cu plată",
      ],
      cta: "Explorați platforma",
      ctaSecondary: "Verificare gratuită a aplicabilității",
    },
    faq: {
      heading: "Întrebări frecvente",
      items: [
        {
          q: "Cât costă un instrument NIS2?",
          a: "Instrumentele GRC comerciale (Vanta, Drata, OneTrust) se situează de regulă între 10.000 și 60.000 EUR pe an pentru o companie de dimensiune medie. nisd2.eu este gratuit. Acompanierea noastră la implementare pornește de la 500 EUR pe lună.",
        },
        {
          q: "Am nevoie de un instrument sau este suficient Excel?",
          a: "Excel nu este suficient. BSI impune o pistă de audit rezistentă la manipulare. După un incident, trebuie să puteți dovedi cine a modificat ce și când. Fișierele Excel se suprascriu. Un auditor BSI va contesta acest lucru.",
        },
        {
          q: "Este suficient un singur instrument sau am nevoie de mai multe?",
          a: "Un instrument GRC acoperă documentația și dovezile. Pentru SIEM, gestionarea patchurilor, MFA și backupuri aveți în continuare nevoie de instrumente tehnice separate. Un instrument NIS2 bun integrează dovezile provenite din aceste sisteme.",
        },
        {
          q: "Poate o platformă gratuită să fie conformă cu NIS2?",
          a: "Da. NIS2 nu impune un anumit furnizor. Ceea ce contează este ca cerințele să fie îndeplinite și documentate într-un mod rezistent la audit. Instrumentele open source și gratuite pot face acest lucru la fel de bine ca soluțiile SaaS costisitoare.",
        },
      ],
    },
    breadcrumb: "Instrument NIS2",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = pickLocalized(content, locale);
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
  const c = pickLocalized(content, locale);

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
          dateModified: "2026-05-03",
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "NIS2", slug: "" },
            { name: c.breadcrumb, slug: "nis2-tool" },
          ],
          locale
        )}
      />
      <JsonLd data={faqJsonLd} />

      <header>
        <Badge variant="secondary" className="mb-3">Buyer's Guide</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{c.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{c.subtitle}</p>
      </header>

      <Separator />

      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">{c.intro}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{c.why.heading}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {c.why.bullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{b}</span>
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
                <TableHead>Tool</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>NIS2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {c.categories.rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="whitespace-normal text-sm text-muted-foreground">
                    {row.purpose}
                  </TableCell>
                  <TableCell className="whitespace-normal text-sm">
                    {row.needed}
                  </TableCell>
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
            {c.checklist.items.map((item, i) => (
              <li key={i} className="flex gap-2">
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
          <CardTitle>{c.ourTool.heading}</CardTitle>
          <CardDescription>{c.ourTool.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {c.ourTool.features.map((f, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button asChild>
              <Link href="/features">{c.ourTool.cta}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/applicability">{c.ourTool.ctaSecondary}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c.faq.heading}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {c.faq.items.map((item, i) => (
            <div key={i}>
              <h3 className="text-sm font-semibold">{item.q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
