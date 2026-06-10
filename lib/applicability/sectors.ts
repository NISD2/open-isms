export type Annex = "I" | "II";

export type SubSector = {
  id: string;
  name: { en: string; de: string };
  naceCode?: string;
  sizeIndependent?: boolean;
};

export type Sector = {
  id: string;
  annex: Annex;
  name: { en: string; de: string };
  description: { en: string; de: string };
  subSectors: SubSector[];
};

export const SECTORS: Sector[] = [
  // ── Annex I — Sectors of High Criticality ──
  {
    id: "energy",
    annex: "I",
    name: { en: "Energy", de: "Energie" },
    description: {
      en: "Electricity generation/distribution, district heating, oil pipelines/refineries, gas networks, hydrogen production and storage.",
      de: "Stromerzeugung/-verteilung, Fernwärme, Ölpipelines/Raffinerien, Gasnetze, Wasserstoffproduktion und -speicherung.",
    },
    subSectors: [
      { id: "energy_electricity", name: { en: "Electricity", de: "Stromversorgung" } },
      { id: "energy_district_heating", name: { en: "District heating/cooling", de: "Fernwärme/-kälte" } },
      { id: "energy_oil", name: { en: "Oil", de: "Kraftstoff/Heizöl" } },
      { id: "energy_gas", name: { en: "Gas", de: "Erdgas" } },
      { id: "energy_hydrogen", name: { en: "Hydrogen", de: "Wasserstoff" } },
    ],
  },
  {
    id: "transport",
    annex: "I",
    name: { en: "Transport", de: "Transport und Verkehr" },
    description: {
      en: "Airlines, airports, air traffic control, railways, maritime/inland shipping, port operators, road ITS operators.",
      de: "Fluggesellschaften, Flughäfen, Flugsicherung, Eisenbahnen, See-/Binnenschifffahrt, Hafenbetreiber, Straßen-ITS-Betreiber.",
    },
    subSectors: [
      { id: "transport_air", name: { en: "Air transport", de: "Luftverkehr" } },
      { id: "transport_rail", name: { en: "Rail transport", de: "Schienenverkehr" } },
      { id: "transport_water", name: { en: "Water/maritime transport", de: "Schifffahrt" } },
      { id: "transport_road", name: { en: "Road (ITS)", de: "Straßenverkehr (ITS)" } },
    ],
  },
  {
    id: "banking",
    annex: "I",
    name: { en: "Banking", de: "Finanzwesen — Banken" },
    description: {
      en: "Credit institutions as defined by EU Regulation 575/2013. Note: entities subject to DORA are exempt from NIS2 risk management/reporting.",
      de: "Kreditinstitute gemäß EU-Verordnung 575/2013. Hinweis: DORA-pflichtige Institute sind von NIS2-Risikomanagement/-Meldepflichten befreit.",
    },
    subSectors: [
      { id: "banking_credit", name: { en: "Credit institutions", de: "Kreditinstitute" } },
    ],
  },
  {
    id: "financial_market",
    annex: "I",
    name: { en: "Financial market infrastructures", de: "Finanzmarkt-Infrastruktur" },
    description: {
      en: "Stock exchanges, trading venues, and central counterparties (CCPs) for clearing.",
      de: "Börsen, Handelsplätze und zentrale Gegenparteien (CCPs) für das Clearing.",
    },
    subSectors: [
      { id: "financial_trading", name: { en: "Trading venues", de: "Handelsplätze" } },
      { id: "financial_ccp", name: { en: "Central counterparties", de: "Zentrale Gegenparteien" } },
    ],
  },
  {
    id: "health",
    annex: "I",
    name: { en: "Health", de: "Gesundheitswesen" },
    description: {
      en: "Hospitals, clinics, pharmaceutical manufacturers (NACE C21), medical device makers, EU reference laboratories.",
      de: "Krankenhäuser, Kliniken, Arzneimittelhersteller (NACE C21), Medizinproduktehersteller, EU-Referenzlaboratorien.",
    },
    subSectors: [
      { id: "health_providers", name: { en: "Hospitals and clinics", de: "Krankenhäuser und Kliniken" } },
      { id: "health_pharma", name: { en: "Pharmaceuticals (NACE C21)", de: "Pharmazeutische Erzeugnisse (NACE C21)" }, naceCode: "C21" },
      { id: "health_devices", name: { en: "Medical devices", de: "Medizinprodukte" } },
      { id: "health_labs", name: { en: "EU reference laboratories", de: "EU-Referenzlaboratorien" } },
    ],
  },
  {
    id: "drinking_water",
    annex: "I",
    name: { en: "Drinking water", de: "Trinkwasser" },
    description: {
      en: "Public water supply and distribution utilities providing water intended for human consumption.",
      de: "Öffentliche Wasserversorgungsunternehmen, die Wasser für den menschlichen Gebrauch bereitstellen.",
    },
    subSectors: [
      { id: "drinking_water_supply", name: { en: "Water supply and distribution", de: "Wasserversorgung und -verteilung" } },
    ],
  },
  {
    id: "waste_water",
    annex: "I",
    name: { en: "Wastewater", de: "Abwasser" },
    description: {
      en: "Urban and industrial wastewater collection, disposal, and treatment operators.",
      de: "Betreiber von städtischer und industrieller Abwassersammlung, -entsorgung und -behandlung.",
    },
    subSectors: [
      { id: "waste_water_treatment", name: { en: "Collection, disposal, treatment", de: "Sammlung, Entsorgung, Behandlung" } },
    ],
  },
  {
    id: "digital_infrastructure",
    annex: "I",
    name: { en: "Digital infrastructure", de: "Digitale Infrastruktur" },
    description: {
      en: "IXPs, DNS providers, TLD registries, cloud services, data centres, CDNs, trust service providers, telecom networks and services.",
      de: "IXPs, DNS-Anbieter, TLD-Register, Cloud-Dienste, Rechenzentren, CDNs, Vertrauensdiensteanbieter, Telekommunikationsnetze und -dienste.",
    },
    subSectors: [
      { id: "digital_ixp", name: { en: "Internet Exchange Points (IXP)", de: "Internet-Knoten (IXP)" } },
      { id: "digital_dns", name: { en: "DNS service providers", de: "DNS-Diensteanbieter" }, sizeIndependent: true },
      { id: "digital_tld", name: { en: "TLD name registries", de: "Top-Level-Domain-Namenregister" }, sizeIndependent: true },
      { id: "digital_cloud", name: { en: "Cloud computing", de: "Cloud-Computing" } },
      { id: "digital_data_centres", name: { en: "Data centres", de: "Rechenzentren" } },
      { id: "digital_cdn", name: { en: "Content Delivery Networks (CDN)", de: "Inhaltszustellnetze (CDN)" } },
      { id: "digital_trust_qualified", name: { en: "Qualified trust service providers (qTSP)", de: "Qualifizierte Vertrauensdiensteanbieter (qTSP)" }, sizeIndependent: true },
      { id: "digital_trust_non_qualified", name: { en: "Non-qualified trust service providers", de: "Nicht qualifizierte Vertrauensdiensteanbieter" }, sizeIndependent: true },
      { id: "digital_telecom_networks", name: { en: "Public electronic communications networks", de: "Öffentliche elektronische Kommunikationsnetze" }, sizeIndependent: true },
      { id: "digital_telecom_services", name: { en: "Public electronic communications services", de: "Öffentliche elektronische Kommunikationsdienste" }, sizeIndependent: true },
    ],
  },
  {
    id: "ict_service_management",
    annex: "I",
    name: { en: "ICT service management (B2B)", de: "Verwaltung von IKT-Diensten (B2B)" },
    description: {
      en: "Companies providing managed IT services (MSP) or managed cybersecurity services (MSSP) to other businesses.",
      de: "Unternehmen, die verwaltete IT-Dienste (MSP) oder verwaltete Cybersicherheitsdienste (MSSP) für andere Unternehmen erbringen.",
    },
    subSectors: [
      { id: "ict_msp", name: { en: "Managed service providers (MSP)", de: "Managed Service Provider (MSP)" } },
      { id: "ict_mssp", name: { en: "Managed security service providers (MSSP)", de: "Managed Security Service Provider (MSSP)" } },
    ],
  },
  {
    id: "public_administration",
    annex: "I",
    name: { en: "Public administration", de: "Öffentliche Verwaltung" },
    description: {
      en: "Federal government entities (Bundesverwaltung). Municipal institutions are excluded in Germany.",
      de: "Einrichtungen der Bundesverwaltung. Kommunale Einrichtungen sind in Deutschland ausgenommen.",
    },
    subSectors: [
      { id: "public_federal", name: { en: "Federal government entities", de: "Einrichtungen der Bundesverwaltung" }, sizeIndependent: true },
    ],
  },
  {
    id: "space",
    annex: "I",
    name: { en: "Space", de: "Weltraum" },
    description: {
      en: "Operators of ground-based infrastructure supporting space-based services (not telecom network providers).",
      de: "Betreiber bodengestützter Infrastruktur zur Unterstützung weltraumgestützter Dienste (keine Telekommunikationsnetzbetreiber).",
    },
    subSectors: [
      { id: "space_ground", name: { en: "Ground-based infrastructure", de: "Bodeninfrastruktur" } },
    ],
  },

  // ── Annex II — Other Critical Sectors ──
  {
    id: "postal_courier",
    annex: "II",
    name: { en: "Postal and courier services", de: "Post- und Kurierdienste" },
    description: {
      en: "Postal service providers, courier services, and parcel delivery companies.",
      de: "Postdienstleister, Kurierdienste und Paketzustellunternehmen.",
    },
    subSectors: [
      { id: "postal_services", name: { en: "Postal and courier services", de: "Post- und Kurierdienste" } },
    ],
  },
  {
    id: "waste_management",
    annex: "II",
    name: { en: "Waste management", de: "Abfallbewirtschaftung" },
    description: {
      en: "Waste collection, treatment, and disposal companies (must be primary business activity).",
      de: "Abfallsammlungs-, -behandlungs- und -entsorgungsunternehmen (muss Hauptgeschäftstätigkeit sein).",
    },
    subSectors: [
      { id: "waste_collection", name: { en: "Waste collection, treatment, disposal", de: "Abfallsammlung, -behandlung, -entsorgung" } },
    ],
  },
  {
    id: "chemicals",
    annex: "II",
    name: { en: "Chemicals", de: "Chemische Stoffe" },
    description: {
      en: "Manufacturing, production, and distribution of chemical substances and mixtures (NACE C20).",
      de: "Herstellung, Produktion und Vertrieb von chemischen Stoffen und Gemischen (NACE C20).",
    },
    subSectors: [
      { id: "chemicals_manufacturing", name: { en: "Manufacturing, production, distribution (NACE C20)", de: "Herstellung, Produktion, Vertrieb (NACE C20)" }, naceCode: "C20" },
    ],
  },
  {
    id: "food",
    annex: "II",
    name: { en: "Food", de: "Lebensmittel" },
    description: {
      en: "Wholesale distribution, industrial food production, and processing companies. Not individual restaurants or small retailers.",
      de: "Großhandel, industrielle Lebensmittelproduktion und -verarbeitung. Keine Einzelrestaurants oder Kleineinzelhändler.",
    },
    subSectors: [
      { id: "food_production", name: { en: "Wholesale, industrial production, processing", de: "Großhandel, industrielle Produktion, Verarbeitung" } },
    ],
  },
  {
    id: "manufacturing",
    annex: "II",
    name: { en: "Manufacturing", de: "Verarbeitendes Gewerbe" },
    description: {
      en: "Medical devices, computers/electronics (C26), electrical equipment (C27), machinery (C28), motor vehicles (C29), transport equipment (C30).",
      de: "Medizinprodukte, Computer/Elektronik (C26), Elektrogeräte (C27), Maschinen (C28), Kraftfahrzeuge (C29), Fahrzeugbau (C30).",
    },
    subSectors: [
      { id: "manufacturing_medical", name: { en: "Medical devices", de: "Medizinprodukte" } },
      { id: "manufacturing_electronics", name: { en: "Computers, electronics, optical (NACE C26)", de: "Computer, Elektronik, Optik (NACE C26)" }, naceCode: "C26" },
      { id: "manufacturing_electrical", name: { en: "Electrical equipment (NACE C27)", de: "Elektrische Ausrüstung (NACE C27)" }, naceCode: "C27" },
      { id: "manufacturing_machinery", name: { en: "Machinery and equipment (NACE C28)", de: "Maschinen und Ausrüstung (NACE C28)" }, naceCode: "C28" },
      { id: "manufacturing_vehicles", name: { en: "Motor vehicles (NACE C29)", de: "Kraftfahrzeuge (NACE C29)" }, naceCode: "C29" },
      { id: "manufacturing_transport", name: { en: "Other transport equipment (NACE C30)", de: "Sonstiger Fahrzeugbau (NACE C30)" }, naceCode: "C30" },
    ],
  },
  {
    id: "digital_providers",
    annex: "II",
    name: { en: "Digital providers", de: "Anbieter digitaler Dienste" },
    description: {
      en: "Online marketplaces (e.g. Amazon, eBay), search engines, and social networking platforms.",
      de: "Online-Marktplätze (z.B. Amazon, eBay), Suchmaschinen und soziale Netzwerke.",
    },
    subSectors: [
      { id: "digital_marketplaces", name: { en: "Online marketplaces", de: "Online-Marktplätze" } },
      { id: "digital_search", name: { en: "Online search engines", de: "Online-Suchmaschinen" } },
      { id: "digital_social", name: { en: "Social networking platforms", de: "Soziale Netzwerke" } },
    ],
  },
  {
    id: "research",
    annex: "II",
    name: { en: "Research", de: "Forschung" },
    description: {
      en: "Applied research organizations focused on commercial exploitation (e.g. Fraunhofer). Does not include universities.",
      de: "Angewandte Forschungseinrichtungen mit kommerziellem Fokus (z.B. Fraunhofer). Keine Universitäten.",
    },
    subSectors: [
      { id: "research_applied", name: { en: "Applied research organizations", de: "Angewandte Forschungseinrichtungen" } },
    ],
  },
];

export const EXCLUSIONS = [
  {
    id: "defence",
    name: { en: "Defence / national security entity", de: "Verteidigung / nationale Sicherheit" },
    description: {
      en: "Armed forces, intelligence agencies, and entities whose primary function is national security.",
      de: "Streitkräfte, Nachrichtendienste und Einrichtungen, deren Hauptfunktion die nationale Sicherheit ist.",
    },
  },
  {
    id: "law_enforcement",
    name: { en: "Law enforcement agency", de: "Strafverfolgungsbehörde" },
    description: {
      en: "Police, criminal investigation agencies, and entities involved in prevention, investigation, or prosecution of criminal offenses.",
      de: "Polizei, Kriminalämter und Einrichtungen zur Verhütung, Ermittlung oder Verfolgung von Straftaten.",
    },
  },
  {
    id: "judiciary",
    name: { en: "Judiciary / court", de: "Justiz / Gericht" },
    description: {
      en: "Courts, tribunals, and judicial authorities at any level.",
      de: "Gerichte, Tribunale und Justizbehörden auf allen Ebenen.",
    },
  },
  {
    id: "parliament",
    name: { en: "Parliament or legislative body", de: "Parlament oder Gesetzgebungsorgan" },
    description: {
      en: "Bundestag, Bundesrat, state parliaments (Landtage), and their administrative offices.",
      de: "Bundestag, Bundesrat, Landtage und deren Verwaltungen.",
    },
  },
  {
    id: "central_bank",
    name: { en: "Central bank (e.g. Bundesbank)", de: "Zentralbank (z.B. Bundesbank)" },
    description: {
      en: "Deutsche Bundesbank and its branches. Does not include commercial banks.",
      de: "Deutsche Bundesbank und ihre Filialen. Keine Geschäftsbanken.",
    },
  },
  {
    id: "municipality",
    name: { en: "Municipal institution (Kommune)", de: "Kommunale Einrichtung (Kommune)" },
    description: {
      en: "Cities, counties (Landkreise), and municipal associations. Excluded from BSIG scope in Germany.",
      de: "Städte, Landkreise und Kommunalverbände. In Deutschland vom BSIG-Anwendungsbereich ausgenommen.",
    },
  },
] as const;

export const SPECIAL_CASES = [
  {
    id: "qtsp",
    name: { en: "Qualified trust service provider (qTSP)", de: "Qualifizierter Vertrauensdiensteanbieter (qTSP)" },
    description: {
      en: "Provider of qualified electronic signatures, seals, or timestamps under the eIDAS Regulation. In scope at any size.",
      de: "Anbieter qualifizierter elektronischer Signaturen, Siegel oder Zeitstempel gemäß eIDAS-Verordnung. Unabhängig von der Größe betroffen.",
    },
    alwaysEssential: true,
  },
  {
    id: "tld_registry",
    name: { en: "TLD name registry (e.g. .de, .com)", de: "Top-Level-Domain-Namenregister (z.B. .de, .com)" },
    description: {
      en: "Organization managing a top-level domain like .de, .com, or .eu. In scope at any size.",
      de: "Organisation, die eine Top-Level-Domain wie .de, .com oder .eu verwaltet. Unabhängig von der Größe betroffen.",
    },
    alwaysEssential: true,
  },
  {
    id: "dns_provider",
    name: { en: "DNS service provider (authoritative or recursive)", de: "DNS-Diensteanbieter (autoritativ oder rekursiv)" },
    description: {
      en: "Operator of authoritative or recursive DNS resolution services. Does not include root name server operators. In scope at any size.",
      de: "Betreiber autoritativer oder rekursiver DNS-Auflösungsdienste. Keine Root-Nameserver-Betreiber. Unabhängig von der Größe betroffen.",
    },
    alwaysEssential: true,
  },
  {
    id: "kritis",
    name: { en: "Critical infrastructure operator (KRITIS per BSI-KritisV)", de: "Betreiber kritischer Anlagen (KRITIS nach BSI-KritisV)" },
    description: {
      en: "Operator of a critical infrastructure facility per BSI-KritisV thresholds, typically serving 500,000+ persons. Highest classification level.",
      de: "Betreiber einer kritischen Anlage nach BSI-KritisV-Schwellenwerten, typischerweise ab 500.000 versorgten Personen. Höchste Einstufung.",
    },
    alwaysEssential: true,
  },
  {
    id: "sole_provider",
    name: { en: "Sole provider of an essential service in Germany", de: "Einziger Erbringer eines wesentlichen Dienstes in Deutschland" },
    description: {
      en: "The only entity providing a service considered essential for critical societal or economic activities in Germany.",
      de: "Das einzige Unternehmen, das einen für kritische gesellschaftliche oder wirtschaftliche Aktivitäten wesentlichen Dienst in Deutschland erbringt.",
    },
    alwaysEssential: true,
  },
  {
    id: "oes_legacy",
    name: { en: "Previously identified as Operator of Essential Services (NIS1)", de: "Zuvor als Betreiber wesentlicher Dienste identifiziert (NIS1)" },
    description: {
      en: "Entity designated as an Operator of Essential Services under the original NIS Directive (2016/1148). Status carries over to NIS2.",
      de: "Einrichtung, die unter der ursprünglichen NIS-Richtlinie (2016/1148) als Betreiber wesentlicher Dienste eingestuft wurde. Status wird in NIS2 übernommen.",
    },
    alwaysEssential: true,
  },
  {
    id: "telecom_provider",
    name: { en: "Public electronic communications network or service provider", de: "Anbieter öffentlicher elektronischer Kommunikationsnetze oder -dienste" },
    description: {
      en: "Provider of public electronic communications networks or publicly available electronic communications services. In scope at any size per Article 2(2)(a)(i). Medium or larger = essential, small = important.",
      de: "Anbieter öffentlicher elektronischer Kommunikationsnetze oder öffentlich zugänglicher elektronischer Kommunikationsdienste. Unabhängig von der Größe betroffen gemäß Artikel 2(2)(a)(i). Ab mittlerer Größe = wesentlich, klein = wichtig.",
    },
    alwaysEssential: false,
  },
  {
    id: "non_qualified_tsp",
    name: { en: "Non-qualified trust service provider", de: "Nicht qualifizierter Vertrauensdiensteanbieter" },
    description: {
      en: "Provider of non-qualified electronic trust services (e.g. non-qualified signatures, seals, timestamps). In scope at any size per Article 2(2)(a)(ii), classified as important.",
      de: "Anbieter nicht qualifizierter elektronischer Vertrauensdienste (z.B. nicht qualifizierte Signaturen, Siegel, Zeitstempel). Unabhängig von der Größe betroffen gemäß Artikel 2(2)(a)(ii), eingestuft als wichtig.",
    },
    alwaysEssential: false,
  },
  {
    id: "domain_registrar",
    name: { en: "Domain name registration service provider", de: "Anbieter von Domänennamen-Registrierungsdiensten" },
    description: {
      en: "Entity providing domain name registration services (registrar). In scope at any size per Article 2(4), classified as important.",
      de: "Einrichtung, die Domänennamen-Registrierungsdienste erbringt (Registrar). Unabhängig von der Größe betroffen gemäß Artikel 2(4), eingestuft als wichtig.",
    },
    alwaysEssential: false,
  },
] as const;

export type ExclusionId = (typeof EXCLUSIONS)[number]["id"];
export type SpecialCaseId = (typeof SPECIAL_CASES)[number]["id"];
