# NIS2 Sector Taxonomy

Complete reference of all sectors, sub-sectors, and entity types covered by the NIS2
directive (EU 2022/2555) and the German implementation (Anlage 1 + 2 BSIG).

## Annex I — Sectors of High Criticality (Anlage 1)

These sectors determine classification as **besonders wichtige Einrichtung** (essential)
for large enterprises, or **wichtige Einrichtung** (important) for medium enterprises.

---

### 1. Energy (Energie)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Electricity** (Stromversorgung) | Electricity undertakings; distribution system operators (DSOs); transmission system operators (TSOs); electricity producers; nominated electricity market operators (NEMOs); electricity market participants; operators of EV charging points | E.ON, RWE, EnBW, Vattenfall, 50Hertz, Amprion, TenneT, TransnetBW, Stadtwerke (large ones), ENBW charging network |
| **District heating/cooling** (Fernwarme/-kalte) | Operators of district heating or district cooling systems | Vattenfall Warme, Stadtwerke Munchen (Fernwarme), STEAG Fernwarme |
| **Oil** (Kraftstoff/Heizol) | Operators of oil transmission pipelines; operators of oil production, refining and treatment facilities, storage and transmission; central stockholding entities | Shell Deutschland, BP Europa, TotalEnergies, EBV (Erdolbevorratungsverband) |
| **Gas** (Erdgas) | Supply undertakings; distribution system operators; transmission system operators; storage system operators; LNG system operators; natural gas undertakings; operators of refining/treatment facilities | Uniper, VNG, Open Grid Europe, GASCADE, bayernets, ONTRAS |
| **Hydrogen** (Wasserstoff) | Operators of hydrogen production, storage, and transmission | Linde, Air Liquide, H2 MOBILITY, thyssenkrupp nucera |

**Legal references**: Directive (EU) 2019/944 (electricity), Directive 2009/73/EC (gas),
Directive (EU) 2024/1788 (hydrogen/gas markets)

---

### 2. Transport (Transport und Verkehr)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Air** (Luftverkehr) | Air carriers (commercial); airport managing bodies; traffic management control operators (ATC/ANS) | Lufthansa, Eurowings, Condor, Fraport (Frankfurt), Flughafen Munchen, DFS Deutsche Flugsicherung |
| **Rail** (Schienenverkehr) | Infrastructure managers; railway undertakings (including operators of service facilities) | Deutsche Bahn (DB Netz, DB Fernverkehr), DB Station&Service, Transdev, Abellio |
| **Water** (Schifffahrt) | Inland, sea, and coastal passenger/freight water transport companies; managing bodies of ports; operators of vessel traffic services (VTS) | Hapag-Lloyd, Hamburg Sud, HHLA (Hamburger Hafen), duisport, Bremer Lagerhaus-Gesellschaft |
| **Road** (Strassenverkehr) | Road authorities responsible for intelligent transport systems (ITS) | Autobahn GmbH des Bundes, Hessen Mobil, BASt |

**Note**: Road transport covers ITS operators only, not general road freight/logistics companies.

---

### 3. Banking (Finanzwesen — Banken)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Banking** | Credit institutions as defined in Regulation (EU) No 575/2013 | Deutsche Bank, Commerzbank, DZ Bank, KfW, Sparkassen (large ones), Volksbanken (large ones) |

**Note**: Financial entities subject to DORA (Regulation (EU) 2022/2554) are exempt from
NIS2 incident reporting and risk management where DORA applies. They still must register.

---

### 4. Financial Market Infrastructures (Finanzmarkt-Infrastruktur)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Financial market** | Operators of trading venues; central counterparties (CCPs) | Deutsche Borse, Eurex Clearing, European Commodity Clearing |

---

### 5. Health (Gesundheitswesen)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Healthcare** | Healthcare providers (hospitals, clinics) | Charite, Universitatsklinikum Heidelberg, Helios, Asklepios, Sana Kliniken |
| **EU reference laboratories** | EU reference laboratories per Regulation (EU) 2022/2371 | Robert Koch-Institut (RKI), Paul-Ehrlich-Institut |
| **Pharmaceuticals** | R&D of medicinal products; manufacturers of basic pharma products and preparations (NACE C21) | Bayer, Boehringer Ingelheim, Merck KGaA, BioNTech, CureVac |
| **Medical devices** | Manufacturers of medical devices considered critical during public health emergencies (Reg. 2017/745) | Siemens Healthineers, B. Braun, Fresenius Medical Care, Draegerwerk |

---

### 6. Drinking Water (Trinkwasser)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Drinking water** | Suppliers and distributors of water intended for human consumption (excluding distributors for whom water is non-essential part of general retail) | Berliner Wasserbetriebe, Hamburger Wasserwerke, Gelsenwasser, RheinEnergie (water division) |

---

### 7. Wastewater (Abwasser)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Wastewater** | Undertakings collecting, disposing of, or treating urban/domestic/industrial wastewater | Stadtentwasserungsbetriebe (large cities), Emschergenossenschaft, Ruhrverband |

---

### 8. Digital Infrastructure (Digitale Infrastruktur)

| Sub-sector | Entity Types | Size Rule | Examples |
|------------|-------------|-----------|----------|
| **IXP providers** | Internet Exchange Point operators | Standard size thresholds | DE-CIX (Frankfurt) |
| **DNS service providers** | DNS providers (NOT root name server operators) | **Any size** (size-independent) | DENIC services, 1&1 IONOS DNS |
| **TLD name registries** | Top-level domain registries | **Any size** (size-independent) | DENIC (.de registry) |
| **Cloud computing** | Cloud computing service providers | Standard size thresholds | SAP Cloud, IONOS Cloud, Open Telekom Cloud, Hetzner Cloud |
| **Data centres** | Data centre service providers | Standard size thresholds | Equinix, NTT, Digital Realty, maincubes |
| **CDN providers** | Content Delivery Network providers | Standard size thresholds | Akamai, Cloudflare (DE operations) |
| **Trust service providers** | Qualified trust service providers (qTSP) | **Any size** (essential); non-qualified TSPs at any size (important) | D-TRUST, Bundesdruckerei, T-Systems (qualified signatures) |
| **Telecom networks** | Providers of public electronic communications networks | Medium+ size = essential | Deutsche Telekom, Vodafone, Telefonica/O2, 1&1 |
| **Telecom services** | Providers of publicly available electronic communications services | Medium+ size = essential | Same as above + smaller ISPs meeting medium threshold |

---

### 9. ICT Service Management — B2B (Verwaltung von IKT-Diensten)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Managed service providers (MSPs)** | Companies providing ICT management services to other businesses | T-Systems, Atos, Bechtle, Computacenter, Cancom |
| **Managed security service providers (MSSPs)** | Companies providing cybersecurity services to other businesses | secunet, G DATA CyberDefense, HiSolutions |

---

### 10. Public Administration (Offentliche Verwaltung)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Central government** | Federal government entities (as defined by Germany) | Bundesministerien, Bundesbehorden |
| **Regional government** | Regional entities following risk-based assessment | Limited in German implementation — primarily federal entities |

**German specificity**: Municipal institutions are generally excluded from BSIG scope.

---

### 11. Space (Weltraum)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Ground infrastructure** | Operators of ground-based infrastructure supporting space-based services (not telecom network providers) | DLR ground stations, OHB SE, Airbus Defence & Space (ground segment) |

---

## Annex II — Other Critical Sectors (Anlage 2)

These sectors produce **wichtige Einrichtungen** (important entities) for both medium and
large enterprises. Large Annex II entities are still "important" — not "essential."

---

### 1. Postal and Courier Services (Post- und Kurierdienste)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Postal/courier** | Postal service providers including courier services | Deutsche Post/DHL, Hermes, DPD, GLS, UPS Germany, FedEx Germany |

---

### 2. Waste Management (Abfallbewirtschaftung)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Waste management** | Undertakings carrying out waste management (excluding those for whom waste is not principal activity) | Remondis, ALBA Group, Veolia (DE), Stadtwerke waste divisions |

**German addition**: Siedlungsabfallentsorgung (municipal waste disposal) also qualifies as
a KRITIS sector with facility-based thresholds (>= 500,000 served persons).

---

### 3. Chemicals (Produktion, Herstellung und Handel mit chemischen Stoffen)

| Sub-sector | Entity Types | NACE Code | Examples |
|------------|-------------|-----------|----------|
| **Chemicals** | Undertakings manufacturing, producing, or distributing substances/mixtures/articles | NACE C20 | BASF, Evonik, Covestro, Lanxess, Wacker Chemie, Henkel (chemical division) |

---

### 4. Food (Produktion, Verarbeitung und Vertrieb von Lebensmitteln)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Food** | Food businesses engaged in wholesale distribution, industrial production, or processing | Edeka (zentral), REWE Group, Lidl/Schwarz-Gruppe, Nestle Deutschland, Dr. Oetker, Sudzucker |

**Note**: This covers wholesale and industrial food businesses, not individual restaurants or small retailers.

---

### 5. Manufacturing (Verarbeitendes Gewerbe / Herstellung von Waren)

| Sub-sector | NACE Code | Entity Types | Examples |
|------------|-----------|-------------|----------|
| **Medical devices** | — | Manufacturers of medical devices (Reg. 2017/745) and in vitro diagnostic devices (Reg. 2017/746) | Carl Zeiss Meditec, Ottobock, Paul Hartmann, Sartorius |
| **Computer, electronic, and optical products** | **C26** | Manufacturers of computers, electronic components, optical instruments, etc. | Infineon, TRUMPF (laser), Jenoptik, Sick AG |
| **Electrical equipment** | **C27** | Manufacturers of electric motors, generators, transformers, wiring, lighting, appliances | Siemens (electrical), Phoenix Contact, Weidmuller, Hager Group |
| **Machinery and equipment n.e.c.** | **C28** | Manufacturers of general-purpose and special-purpose machinery | GEA Group, KUKA, Duerr AG, Korber, Heidelberger Druckmaschinen |
| **Motor vehicles, trailers, semi-trailers** | **C29** | Manufacturers of motor vehicles and vehicle parts | Volkswagen, BMW, Mercedes-Benz, Continental, ZF Friedrichshafen, Bosch (automotive) |
| **Other transport equipment** | **C30** | Manufacturers of ships, rail vehicles, aircraft, military vehicles | ThyssenKrupp Marine Systems, Airbus (DE), MTU Aero Engines, Rheinmetall, Krauss-Maffei Wegmann |

---

### 6. Digital Providers (Anbieter digitaler Dienste)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Online marketplaces** | Providers of online marketplaces | Amazon.de, eBay.de, Zalando, Otto Group |
| **Online search engines** | Providers of online search engines | (Primarily US companies with EU presence — Ecosia is German) |
| **Social networking platforms** | Providers of social networking services | (Primarily US — XING/New Work SE is German) |

---

### 7. Research (Forschung)

| Sub-sector | Entity Types | Examples |
|------------|-------------|----------|
| **Research organizations** | Organizations with primary goal of applied research or experimental development for commercial exploitation. Does NOT include educational institutions (universities). | Fraunhofer-Gesellschaft, Helmholtz Association, Max-Planck-Gesellschaft (applied divisions), Leibniz Association |

---

## Sector-to-KRITIS Mapping

For KRITIS operator classification, the following sectors have facility-based thresholds
(BSI-KritisV, typically >= 500,000 served persons per facility):

| KRITIS Sector | NIS2 Mapping | Threshold Example |
|---------------|-------------|-------------------|
| Energie | Annex I — Energy | 500,000 served persons |
| Transport und Verkehr | Annex I — Transport | Varies by sub-sector |
| Finanzwesen | Annex I — Banking + Financial Market | 500,000 accounts/transactions |
| Gesundheitswesen | Annex I — Health | 30,000 full inpatient cases/year |
| Trinkwasser | Annex I — Drinking Water | 500,000 served persons |
| Ernahrung | Annex II — Food | 500,000 served persons |
| IT und Telekommunikation | Annex I — Digital Infrastructure | 100,000 customers/participants |
| Weltraum | Annex I — Space | Facility-specific |
| Siedlungsabfallentsorgung | Annex II — Waste Management | 500,000 served persons |

KRITIS operators are automatically classified as **besonders wichtige Einrichtungen**
(essential entities) regardless of company size.

---

## NACE Code Quick Reference

| NACE Code | Description | NIS2 Annex |
|-----------|-------------|------------|
| C20 | Chemicals manufacturing | Annex II |
| C21 | Pharmaceutical manufacturing | Annex I (Health) |
| C26 | Computer, electronic, optical products | Annex II (Manufacturing) |
| C27 | Electrical equipment | Annex II (Manufacturing) |
| C28 | Machinery and equipment n.e.c. | Annex II (Manufacturing) |
| C29 | Motor vehicles, trailers, semi-trailers | Annex II (Manufacturing) |
| C30 | Other transport equipment | Annex II (Manufacturing) |
