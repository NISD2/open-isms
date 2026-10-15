import { FIELD_TYPE, type IncidentField, REPORT_TYPE, SECTION } from "../schema";

export const impactFields: ReadonlyArray<IncidentField> = [
  {
    id: "affectedUsersCount",
    section: SECTION.IMPACT,
    type: FIELD_TYPE.INTEGER,
    label: {
      en: "Affected users (estimate)",
      de: "Betroffene Nutzer (geschätzt)",
      fr: "Utilisateurs affectés (estimation)",
      it: "Utenti interessati (stima)",
      es: "Usuarios afectados (estimación)",
      pl: "Dotknięci użytkownicy (szacunek)",
      cs: "Dotčení uživatelé (odhad)",
      pt: "Utilizadores afetados (estimativa)",
      ro: "Utilizatori afectați (estimare)",
    },
    description: {
      en: "Estimated count of affected users. CIR 2024/2690 quantifies thresholds for the digital-service-provider categories it covers; for other entities the assessment is qualitative per NIS 2 Art. 23(3).",
      de: "Geschätzte Anzahl betroffener Nutzer. CIR 2024/2690 quantifiziert Schwellen für die dort erfassten Anbieter digitaler Dienste; sonst ist die Einschätzung qualitativ nach Art. 23(3) NIS 2.",
      fr: "Nombre estimé d'utilisateurs affectés. CIR 2024/2690 quantifie des seuils pour les catégories de fournisseurs de services numériques qu'il couvre ; pour les autres entités, l'évaluation est qualitative au titre de l'art. 23(3) NIS 2.",
      it: "Numero stimato di utenti interessati. CIR 2024/2690 quantifica le soglie per le categorie di fornitori di servizi digitali che disciplina; per gli altri soggetti la valutazione è qualitativa ai sensi dell'art. 23(3) NIS 2.",
      es: "Número estimado de usuarios afectados. CIR 2024/2690 cuantifica umbrales para las categorías de proveedores de servicios digitales que regula; para las demás entidades la evaluación es cualitativa conforme al art. 23(3) NIS 2.",
      pl: "Szacowana liczba dotkniętych użytkowników. CIR 2024/2690 określa ilościowo progi dla objętych nim kategorii dostawców usług cyfrowych; dla pozostałych podmiotów ocena ma charakter jakościowy zgodnie z art. 23(3) NIS 2.",
      cs: "Odhadovaný počet dotčených uživatelů. CIR 2024/2690 kvantifikuje prahové hodnoty pro kategorie poskytovatelů digitálních služeb, na které se vztahuje; u ostatních subjektů je posouzení kvalitativní podle čl. 23 odst. 3 NIS 2.",
      pt: "Número estimado de utilizadores afetados. O CIR 2024/2690 quantifica limiares para as categorias de prestadores de serviços digitais que abrange; para as restantes entidades, a avaliação é qualitativa nos termos do art. 23.º, n.º 3, da NIS 2.",
      ro: "Numărul estimat de utilizatori afectați. CIR 2024/2690 cuantifică praguri pentru categoriile de furnizori de servicii digitale pe care le reglementează; pentru celelalte entități, evaluarea este calitativă în temeiul art. 23 alin. (3) din NIS 2.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INTERMEDIATE,
      REPORT_TYPE.PROGRESS,
    ],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(3)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
      {
        citation: "CIR 2024/2690 (where applicable)",
        url: "https://eur-lex.europa.eu/eli/reg_impl/2024/2690/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Servicestörung",
        portalFieldName: "Betroffene Nutzer (geschätzt)",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 33(3)(a)",
        fieldReference: "Approximate number of data subjects concerned",
      },
    ],
  },
  {
    id: "serviceDisruptionDescription",
    section: SECTION.IMPACT,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Service disruption description",
      de: "Beschreibung der Servicestörung",
      fr: "Description de la perturbation de service",
      it: "Descrizione dell'interruzione del servizio",
      es: "Descripción de la interrupción del servicio",
      pl: "Opis zakłócenia usługi",
      cs: "Popis narušení služby",
      pt: "Descrição da interrupção do serviço",
      ro: "Descrierea perturbării serviciului",
    },
    description: {
      en: "Narrative of which services (operational, customer-facing, internal) were degraded or unavailable and for how long. NIS 2 Art. 23(3)(a) makes severe operational disruption of the services one of the criteria for a 'significant incident'.",
      de: "Beschreibung, welche Dienste (Betrieb, kundenseitig, intern) beeinträchtigt oder nicht verfügbar waren und wie lange. Art. 23(3)(a) NIS 2 macht schwerwiegende Betriebsstörungen der Dienste zu einem der Kriterien für einen erheblichen Sicherheitsvorfall.",
      fr: "Description des services (opérationnels, destinés aux clients, internes) qui ont été dégradés ou indisponibles et pendant combien de temps. L'art. 23(3)(a) NIS 2 fait de la perturbation opérationnelle grave des services l'un des critères d'un 'incident important'.",
      it: "Descrizione di quali servizi (operativi, rivolti ai clienti, interni) sono stati degradati o non disponibili e per quanto tempo. L'art. 23(3)(a) NIS 2 fa della grave perturbazione operativa dei servizi uno dei criteri di un 'incidente significativo'.",
      es: "Descripción de qué servicios (operativos, de cara al cliente, internos) se vieron degradados o no disponibles y durante cuánto tiempo. El art. 23(3)(a) NIS 2 convierte las graves perturbaciones operativas de los servicios en uno de los criterios de un 'incidente significativo'.",
      pl: "Opis tego, które usługi (operacyjne, skierowane do klientów, wewnętrzne) zostały pogorszone lub niedostępne i przez jak długi czas. Art. 23(3)(a) NIS 2 czyni dotkliwe zakłócenia operacyjne usług jednym z kryteriów 'poważnego incydentu'.",
      cs: "Popis toho, které služby (provozní, určené zákazníkům, interní) byly degradovány nebo nedostupné a po jak dlouhou dobu. Čl. 23 odst. 3 písm. a) NIS 2 řadí závažné provozní narušení služeb mezi kritéria, podle kterých se incident považuje za „významný“.",
      pt: "Descrição de quais serviços (operacionais, voltados para o cliente, internos) foram degradados ou ficaram indisponíveis e durante quanto tempo. O art. 23.º, n.º 3, alínea a), da NIS 2 faz das graves perturbações operacionais dos serviços um dos critérios de um 'incidente significativo'.",
      ro: "Descrierea serviciilor (operaționale, destinate clienților, interne) care au fost degradate sau indisponibile și pentru cât timp. Art. 23 alin. (3) lit. (a) din NIS 2 face din perturbările operaționale grave ale serviciilor unul dintre criteriile unui 'incident semnificativ'.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INTERMEDIATE,
      REPORT_TYPE.PROGRESS,
    ],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(3)(a)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Servicestörung",
        portalFieldName: "Beschreibung der Dienstausfälle",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "DORA Art. 19(4)",
        fieldReference: "Functional impact and operational unavailability",
      },
    ],
  },
  {
    id: "estimatedFinancialDamage",
    section: SECTION.IMPACT,
    type: FIELD_TYPE.DECIMAL,
    label: {
      en: "Estimated financial damage (EUR)",
      de: "Geschätzter finanzieller Schaden (EUR)",
      fr: "Dommage financier estimé (EUR)",
      it: "Danno finanziario stimato (EUR)",
      es: "Daño financiero estimado (EUR)",
      pl: "Szacowana szkoda finansowa (EUR)",
      cs: "Odhadovaná finanční škoda (EUR)",
      pt: "Dano financeiro estimado (EUR)",
      ro: "Daune financiare estimate (EUR)",
    },
    description: {
      en: "Estimated direct and indirect financial damage. NIS 2 Art. 23(3)(a) includes financial loss for the entity concerned among the criteria that make an incident 'significant'.",
      de: "Geschätzter unmittelbarer und mittelbarer finanzieller Schaden. Art. 23(3)(a) NIS 2 zählt finanzielle Verluste für die betreffende Einrichtung zu den Kriterien, die einen Vorfall als 'erheblich' qualifizieren.",
      fr: "Dommage financier direct et indirect estimé. L'art. 23(3)(a) NIS 2 inclut les pertes financières pour l'entité concernée parmi les critères qui élèvent un incident au rang d''important'.",
      it: "Danno finanziario diretto e indiretto stimato. L'art. 23(3)(a) NIS 2 include le perdite finanziarie per il soggetto interessato tra i criteri che elevano un incidente a 'significativo'.",
      es: "Daño financiero directo e indirecto estimado. El art. 23(3)(a) NIS 2 incluye las pérdidas económicas para la entidad afectada entre los criterios que elevan un incidente a 'significativo'.",
      pl: "Szacowana bezpośrednia i pośrednia szkoda finansowa. Art. 23(3)(a) NIS 2 zalicza straty finansowe dla danego podmiotu do kryteriów, które kwalifikują incydent jako 'poważny'.",
      cs: "Odhadovaná přímá a nepřímá finanční škoda. Čl. 23 odst. 3 písm. a) NIS 2 řadí finanční ztráty dotčeného subjektu mezi kritéria, podle kterých se incident považuje za „významný“.",
      pt: "Dano financeiro direto e indireto estimado. O art. 23.º, n.º 3, alínea a), da NIS 2 inclui as perdas financeiras para a entidade em causa entre os critérios que elevam um incidente a 'significativo'.",
      ro: "Daune financiare directe și indirecte estimate. Art. 23 alin. (3) lit. (a) din NIS 2 include pierderile financiare pentru entitatea în cauză printre criteriile care ridică un incident la rangul de 'semnificativ'.",
    },
    requiredIn: [],
    optionalIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INCIDENT_NOTIFICATION,
      REPORT_TYPE.INTERMEDIATE,
      REPORT_TYPE.PROGRESS,
      REPORT_TYPE.FINAL,
    ],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(3)(a)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Servicestörung",
        portalFieldName: "Finanzieller Schaden (geschätzt)",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "DORA Art. 19(4)",
        fieldReference: "Economic impact",
      },
    ],
  },
  {
    id: "hasReputationalHarm",
    section: SECTION.IMPACT,
    type: FIELD_TYPE.BOOLEAN,
    label: {
      en: "Reputational harm (yes / no)",
      de: "Reputationsschaden (ja / nein)",
      fr: "Atteinte à la réputation (oui / non)",
      it: "Danno reputazionale (sì / no)",
      es: "Daño reputacional (sí / no)",
      pl: "Szkoda reputacyjna (tak / nie)",
      cs: "Reputační škoda (ano / ne)",
      pt: "Dano reputacional (sim / não)",
      ro: "Prejudiciu reputațional (da / nu)",
    },
    description: {
      en: "Whether the entity assesses that the incident has caused or is likely to cause reputational harm. NIS 2 Art. 23(3) does not list reputational harm among the criteria for a 'significant incident'; the field records the entity's own view as part of the impact assessment under Art. 23(4)(b). DORA Art. 18(1)(a) does use reputational impact to classify ICT-related incidents at financial entities.",
      de: "Einschätzung, ob der Vorfall zu Reputationsschäden geführt hat oder wahrscheinlich führen wird. Art. 23(3) NIS 2 nennt Reputationsschäden nicht unter den Kriterien für einen 'erheblichen Sicherheitsvorfall'; das Feld hält die eigene Einschätzung der Einrichtung als Teil der Bewertung der Auswirkungen nach Art. 23(4)(b) NIS 2 fest. Bei Finanzunternehmen zählen Reputationsschäden dagegen zu den Klassifizierungskriterien nach Art. 18(1)(a) DORA.",
      fr: "Évaluation par l'entité selon laquelle l'incident a causé ou est susceptible de causer une atteinte à la réputation. L'art. 23(3) NIS 2 ne range pas l'atteinte à la réputation parmi les critères d'un 'incident important' ; le champ consigne l'appréciation propre de l'entité dans le cadre de l'évaluation de l'impact prévue à l'art. 23(4)(b) NIS 2. Pour les entités financières, l'art. 18(1)(a) DORA retient en revanche l'atteinte à la réputation comme critère de classification des incidents liés aux TIC.",
      it: "Valutazione del soggetto in merito al fatto che l'incidente abbia causato o sia probabile che causi un danno reputazionale. L'art. 23(3) NIS 2 non include il danno reputazionale tra i criteri di un 'incidente significativo'; il campo registra il giudizio del soggetto nell'ambito della valutazione dell'impatto di cui all'art. 23(4)(b) NIS 2. Per le entità finanziarie, l'art. 18(1)(a) DORA utilizza invece l'impatto reputazionale per classificare gli incidenti connessi alle TIC.",
      es: "Evaluación de la entidad sobre si el incidente ha causado o es probable que cause un daño reputacional. El art. 23(3) NIS 2 no incluye el daño reputacional entre los criterios de un 'incidente significativo'; el campo recoge la apreciación propia de la entidad como parte de la evaluación del impacto prevista en el art. 23(4)(b) NIS 2. Para las entidades financieras, el art. 18(1)(a) DORA sí utiliza el impacto reputacional para clasificar los incidentes relacionados con las TIC.",
      pl: "Ocena podmiotu, czy incydent spowodował lub może spowodować szkodę reputacyjną. Art. 23(3) NIS 2 nie wymienia szkody reputacyjnej wśród kryteriów 'poważnego incydentu'; pole odnotowuje stanowisko podmiotu w ramach oceny skutków, o której mowa w art. 23(4)(b) NIS 2. W przypadku podmiotów finansowych art. 18(1)(a) DORA uwzględnia natomiast wpływ na reputację przy klasyfikacji incydentów związanych z ICT.",
      cs: "Posouzení subjektu, zda incident způsobil nebo pravděpodobně způsobí reputační škodu. Čl. 23 odst. 3 NIS 2 neuvádí reputační škodu mezi kritérii „významného incidentu“; pole zaznamenává vlastní pohled subjektu jako součást posouzení dopadu podle čl. 23 odst. 4 písm. b) NIS 2. U finančních subjektů naopak čl. 18 odst. 1 písm. a) DORA zohledňuje při klasifikaci incidentů souvisejících s IKT i to, zda incident poškodil dobrou pověst.",
      pt: "Avaliação da entidade sobre se o incidente causou ou é provável que cause dano reputacional. O art. 23.º, n.º 3, da NIS 2 não inclui o dano reputacional entre os critérios de um 'incidente significativo'; o campo regista a apreciação própria da entidade no âmbito da avaliação do impacto prevista no art. 23.º, n.º 4, alínea b), da NIS 2. Para as entidades financeiras, o art. 18.º, n.º 1, alínea a), do DORA utiliza, pelo contrário, o impacto reputacional para classificar os incidentes relacionados com as TIC.",
      ro: "Evaluarea entității cu privire la faptul că incidentul a cauzat sau este probabil să cauzeze un prejudiciu reputațional. Art. 23 alin. (3) din NIS 2 nu include prejudiciul reputațional printre criteriile unui 'incident semnificativ'; câmpul consemnează aprecierea proprie a entității, ca parte a evaluării impactului prevăzute la art. 23 alin. (4) lit. (b) din NIS 2. Pentru entitățile financiare, art. 18 alin. (1) lit. (a) din DORA folosește în schimb impactul reputațional pentru clasificarea incidentelor legate de TIC.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INTERMEDIATE,
      REPORT_TYPE.PROGRESS,
    ],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(b)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Servicestörung",
        portalFieldName: "Reputationsschaden",
      },
    ],
    crossRegulationOverlaps: [],
  },
];
