/**
 * BSI IT-Grundschutz Elementary Threats (Elementare Gefährdungen)
 *
 * All 47 threats from the IT-Grundschutz Compendium (Edition 2023).
 * Used as suggestions when creating risks in the risk register.
 * Source: https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/IT-Grundschutz/IT-Grundschutz-Kompendium/Elementare-Gefaehrdungen/elementare-gefaehrdungen_node.html
 */

export interface BsiThreat {
  code: string;
  labelDe: string;
  labelEn: string;
  category: "physical" | "infrastructure" | "cyber" | "organizational" | "human";
}

export const BSI_ELEMENTARY_THREATS: BsiThreat[] = [
  { code: "G 0.1", labelDe: "Feuer", labelEn: "Fire", category: "physical" },
  { code: "G 0.2", labelDe: "Ungünstige klimatische Bedingungen", labelEn: "Unfavourable Climatic Conditions", category: "physical" },
  { code: "G 0.3", labelDe: "Wasser", labelEn: "Water", category: "physical" },
  { code: "G 0.4", labelDe: "Verschmutzung, Staub, Korrosion", labelEn: "Pollution, Dust, Corrosion", category: "physical" },
  { code: "G 0.5", labelDe: "Naturkatastrophen", labelEn: "Natural Disasters", category: "physical" },
  { code: "G 0.6", labelDe: "Katastrophen im Umfeld", labelEn: "Disasters in the Environment", category: "physical" },
  { code: "G 0.7", labelDe: "Großereignisse im Umfeld", labelEn: "Major Events in the Environment", category: "physical" },
  { code: "G 0.8", labelDe: "Ausfall oder Störung der Stromversorgung", labelEn: "Failure or Disruption of Power Supply", category: "infrastructure" },
  { code: "G 0.9", labelDe: "Ausfall oder Störung von Kommunikationsnetzen", labelEn: "Failure or Disruption of Communication Networks", category: "infrastructure" },
  { code: "G 0.10", labelDe: "Ausfall oder Störung von Versorgungsnetzen", labelEn: "Failure or Disruption of Supply Networks", category: "infrastructure" },
  { code: "G 0.11", labelDe: "Ausfall oder Störung von Dienstleistern", labelEn: "Failure or Disruption of Service Providers", category: "infrastructure" },
  { code: "G 0.12", labelDe: "Elektromagnetische Störstrahlung", labelEn: "Electromagnetic Interference", category: "physical" },
  { code: "G 0.13", labelDe: "Abfangen kompromittierender Strahlung", labelEn: "Interception of Compromising Emissions", category: "cyber" },
  { code: "G 0.14", labelDe: "Ausspähen von Informationen (Spionage)", labelEn: "Espionage / Interception of Information", category: "cyber" },
  { code: "G 0.15", labelDe: "Abhören", labelEn: "Eavesdropping", category: "cyber" },
  { code: "G 0.16", labelDe: "Diebstahl von Geräten, Datenträgern oder Dokumenten", labelEn: "Theft of Devices, Media or Documents", category: "physical" },
  { code: "G 0.17", labelDe: "Verlust von Geräten, Datenträgern oder Dokumenten", labelEn: "Loss of Devices, Media or Documents", category: "human" },
  { code: "G 0.18", labelDe: "Fehlplanung oder fehlende Anpassung", labelEn: "Bad Planning or Lack of Adaptation", category: "organizational" },
  { code: "G 0.19", labelDe: "Offenlegung schützenswerter Informationen", labelEn: "Disclosure of Sensitive Information", category: "cyber" },
  { code: "G 0.20", labelDe: "Informationen oder Produkte aus unzuverlässiger Quelle", labelEn: "Information or Products from Unreliable Source", category: "organizational" },
  { code: "G 0.21", labelDe: "Manipulation von Hard- oder Software", labelEn: "Manipulation of Hardware or Software", category: "cyber" },
  { code: "G 0.22", labelDe: "Manipulation von Informationen", labelEn: "Manipulation of Information", category: "cyber" },
  { code: "G 0.23", labelDe: "Unbefugtes Eindringen in IT-Systeme", labelEn: "Unauthorised Access to IT Systems", category: "cyber" },
  { code: "G 0.24", labelDe: "Zerstörung von Geräten oder Datenträgern", labelEn: "Destruction of Devices or Media", category: "physical" },
  { code: "G 0.25", labelDe: "Ausfall von Geräten oder Systemen", labelEn: "Failure of Devices or Systems", category: "infrastructure" },
  { code: "G 0.26", labelDe: "Fehlfunktion von Geräten oder Systemen", labelEn: "Malfunction of Devices or Systems", category: "infrastructure" },
  { code: "G 0.27", labelDe: "Ressourcenmangel", labelEn: "Lack of Resources", category: "organizational" },
  { code: "G 0.28", labelDe: "Software-Schwachstellen oder -Fehler", labelEn: "Software Vulnerabilities or Errors", category: "cyber" },
  { code: "G 0.29", labelDe: "Verstoß gegen Gesetze oder Regelungen", labelEn: "Violation of Laws or Regulations", category: "organizational" },
  { code: "G 0.30", labelDe: "Unberechtigte Nutzung oder Administration von Geräten und Systemen", labelEn: "Unauthorised Use or Administration of Systems", category: "cyber" },
  { code: "G 0.31", labelDe: "Fehlerhafte Nutzung oder Administration von Geräten und Systemen", labelEn: "Incorrect Use or Administration of Systems", category: "human" },
  { code: "G 0.32", labelDe: "Missbrauch von Berechtigungen", labelEn: "Misuse of Authorisations", category: "cyber" },
  { code: "G 0.33", labelDe: "Personalausfall", labelEn: "Loss of Personnel", category: "organizational" },
  { code: "G 0.34", labelDe: "Anschlag", labelEn: "Sabotage / Terrorism", category: "physical" },
  { code: "G 0.35", labelDe: "Nötigung, Erpressung oder Korruption", labelEn: "Coercion, Extortion or Corruption", category: "human" },
  { code: "G 0.36", labelDe: "Identitätsdiebstahl", labelEn: "Identity Theft", category: "cyber" },
  { code: "G 0.37", labelDe: "Abstreiten von Handlungen", labelEn: "Repudiation of Actions", category: "cyber" },
  { code: "G 0.38", labelDe: "Missbrauch personenbezogener Daten", labelEn: "Misuse of Personal Data", category: "organizational" },
  { code: "G 0.39", labelDe: "Schadprogramme", labelEn: "Malware", category: "cyber" },
  { code: "G 0.40", labelDe: "Verhinderung von Diensten (Denial of Service)", labelEn: "Denial of Service", category: "cyber" },
  { code: "G 0.41", labelDe: "Sabotage", labelEn: "Sabotage", category: "physical" },
  { code: "G 0.42", labelDe: "Social Engineering", labelEn: "Social Engineering", category: "human" },
  { code: "G 0.43", labelDe: "Einspielen von Nachrichten", labelEn: "Message Injection / Replay Attacks", category: "cyber" },
  { code: "G 0.44", labelDe: "Unbefugtes Eindringen in Räumlichkeiten", labelEn: "Unauthorised Entry to Premises", category: "physical" },
  { code: "G 0.45", labelDe: "Datenverlust", labelEn: "Data Loss", category: "cyber" },
  { code: "G 0.46", labelDe: "Integritätsverlust schützenswerter Informationen", labelEn: "Loss of Integrity of Sensitive Information", category: "cyber" },
  { code: "G 0.47", labelDe: "Schädliche Seiteneffekte IT-gestützter Angriffe", labelEn: "Harmful Side Effects of IT-supported Attacks", category: "cyber" },
];

export const BSI_THREAT_CATEGORIES = {
  physical: { labelEn: "Physical / Environmental", labelDe: "Physisch / Umwelt" },
  infrastructure: { labelEn: "Infrastructure", labelDe: "Infrastruktur" },
  cyber: { labelEn: "Cyber / IT", labelDe: "Cyber / IT" },
  organizational: { labelEn: "Organizational", labelDe: "Organisatorisch" },
  human: { labelEn: "Human", labelDe: "Menschlich" },
} as const;
