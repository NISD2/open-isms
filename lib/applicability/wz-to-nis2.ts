/**
 * Maps WZ2008 (Wirtschaftszweige) codes to NIS2 sector IDs.
 *
 * Sources:
 * - NIS2 Directive Annex I & II (EU 2022/2555)
 * - BSIG §28 sector definitions
 * - WZ2008 classification (aligns with NACE Rev. 2)
 *
 * Key: WZ2008 4-digit code
 * Value: Array of NIS2 sector IDs (from sectors.ts)
 *
 * Known limitations of WZ-based mapping:
 * - Online marketplaces, social networks, IXPs, CDNs, cloud providers, trust services
 *   have no reliable WZ code — they are business-model distinctions, not industry codes.
 * - NIS2 road transport only covers road authorities and ITS operators (Directive 2010/40/EU),
 *   not general passenger/freight transport.
 * - Public administration entities are identified by institutional designation, not WZ code.
 */

type WzMapping = { sectorId: string; subSectorId?: string };

const WZ_PREFIX_MAP: Record<string, WzMapping[]> = {
  // ── Energy (Annex I) ──
  "35.11": [{ sectorId: "energy", subSectorId: "energy_electricity" }],
  "35.12": [{ sectorId: "energy", subSectorId: "energy_electricity" }],
  "35.13": [{ sectorId: "energy", subSectorId: "energy_electricity" }],
  "35.14": [{ sectorId: "energy", subSectorId: "energy_electricity" }],
  "35.21": [{ sectorId: "energy", subSectorId: "energy_gas" }],
  "35.22": [{ sectorId: "energy", subSectorId: "energy_gas" }],
  "35.23": [{ sectorId: "energy", subSectorId: "energy_gas" }],
  "35.30": [{ sectorId: "energy", subSectorId: "energy_district_heating" }],
  "06.10": [{ sectorId: "energy", subSectorId: "energy_oil" }],
  "06.20": [{ sectorId: "energy", subSectorId: "energy_gas" }],
  "19.20": [{ sectorId: "energy", subSectorId: "energy_oil" }],
  // NB: 49.50 covers ALL pipeline transport (oil, gas, hydrogen, other substances).
  // Mapped to energy_oil as the primary use case; hydrogen/gas pipeline operators also have this code.
  "49.50": [{ sectorId: "energy", subSectorId: "energy_oil" }],
  // NB: 20.11 (industrial gases) covers all gases, not just hydrogen.
  // It maps to chemicals (NACE C20), not energy_hydrogen.
  // NB: No WZ2008 code exists for energy storage (WZ2025 introduces 35.16) or EV charging operators.

  // ── Transport (Annex I) ──
  "49.10": [{ sectorId: "transport", subSectorId: "transport_rail" }],
  "49.20": [{ sectorId: "transport", subSectorId: "transport_rail" }],
  // NB: 49.31/49.39 (passenger land transport) removed — NIS2 road transport only covers
  // road authorities and ITS operators (Directive 2010/40/EU), not bus/coach companies.
  "50.10": [{ sectorId: "transport", subSectorId: "transport_water" }],
  "50.20": [{ sectorId: "transport", subSectorId: "transport_water" }],
  "50.30": [{ sectorId: "transport", subSectorId: "transport_water" }],
  "50.40": [{ sectorId: "transport", subSectorId: "transport_water" }],
  "51.10": [{ sectorId: "transport", subSectorId: "transport_air" }],
  "51.21": [{ sectorId: "transport", subSectorId: "transport_air" }],
  // NB: 52.21 (land transport services) too broad — covers parking, towing, bus stations.
  // NIS2 road transport is narrower. Rail station operators could qualify under rail.
  "52.22": [{ sectorId: "transport", subSectorId: "transport_water" }],
  "52.23": [{ sectorId: "transport", subSectorId: "transport_air" }],

  // ── Banking (Annex I) ──
  // NIS2 covers "credit institutions" per Reg. 575/2013 Art. 4(1): must accept deposits AND grant credit.
  // NB: 64.92 (other credit granting) removed — leasing/factoring/consumer finance companies only
  // grant credit without deposit-taking, so they are NOT credit institutions. (Covered by DORA, not NIS2.)
  // NB: 64.11 (central banking) excluded — central banks exempt per NIS2 Art. 2(7).
  "64.19": [{ sectorId: "banking", subSectorId: "banking_credit" }],

  // ── Financial market (Annex I) ──
  // NIS2 covers trading venues and central counterparties (CCPs).
  // NB: 66.12 (securities/commodity brokerage) removed — brokers are not trading venues or CCPs.
  // They fall under DORA as financial entities, not NIS2 Annex I.
  "66.11": [{ sectorId: "financial_market", subSectorId: "financial_trading" }],

  // ── Health (Annex I) ──
  "86.10": [{ sectorId: "health", subSectorId: "health_providers" }],
  "86.21": [{ sectorId: "health", subSectorId: "health_providers" }],
  "86.22": [{ sectorId: "health", subSectorId: "health_providers" }],
  "86.23": [{ sectorId: "health", subSectorId: "health_providers" }],
  "21.10": [{ sectorId: "health", subSectorId: "health_pharma" }],
  "21.20": [{ sectorId: "health", subSectorId: "health_pharma" }],
  // NB: 32.50 (medical devices) — general manufacturers fall under Annex II manufacturing,
  // not Annex I health. Annex I only covers devices "critical during a public health emergency"
  // per Regulation 2022/123 Art. 22. Mapping to manufacturing for the general case.
  "32.50": [{ sectorId: "manufacturing", subSectorId: "manufacturing_medical" }],

  // ── Drinking water (Annex I) ──
  "36.00": [{ sectorId: "drinking_water", subSectorId: "drinking_water_supply" }],

  // ── Wastewater (Annex I) ──
  "37.00": [{ sectorId: "waste_water", subSectorId: "waste_water_treatment" }],

  // ── Digital infrastructure (Annex I) ──
  "61.10": [{ sectorId: "digital_infrastructure", subSectorId: "digital_telecom_networks" }],
  "61.20": [{ sectorId: "digital_infrastructure", subSectorId: "digital_telecom_networks" }],
  "61.30": [{ sectorId: "digital_infrastructure", subSectorId: "digital_telecom_networks" }],
  "61.90": [{ sectorId: "digital_infrastructure", subSectorId: "digital_telecom_services" }],
  // NB: 63.11 covers "Datenverarbeitung, Hosting und damit verbundene Tätigkeiten" —
  // both data centres AND cloud computing providers. No separate WZ code exists for cloud.
  // IXP, CDN, DNS, TLD, and trust service providers also have no dedicated WZ code.
  "63.11": [
    { sectorId: "digital_infrastructure", subSectorId: "digital_data_centres" },
    { sectorId: "digital_infrastructure", subSectorId: "digital_cloud" },
  ],

  // ── ICT service management (Annex I) ──
  // NB: Only 62.03 (facilities management) clearly maps to MSP.
  // 62.01 (programming) and 62.02 (consultancy) are overly broad — a custom software
  // dev shop is not an MSP. Kept 62.09 as partially relevant (disaster recovery etc).
  "62.03": [{ sectorId: "ict_service_management", subSectorId: "ict_msp" }],
  "62.09": [{ sectorId: "ict_service_management", subSectorId: "ict_msp" }],

  // ── Space (Annex I) ──
  "51.22": [{ sectorId: "space", subSectorId: "space_ground" }],

  // ── Postal & courier (Annex II) ──
  "53.10": [{ sectorId: "postal_courier", subSectorId: "postal_services" }],
  "53.20": [{ sectorId: "postal_courier", subSectorId: "postal_services" }],

  // ── Waste management (Annex II) ──
  "38.11": [{ sectorId: "waste_management", subSectorId: "waste_collection" }],
  "38.12": [{ sectorId: "waste_management", subSectorId: "waste_collection" }],
  "38.21": [{ sectorId: "waste_management", subSectorId: "waste_collection" }],
  "38.22": [{ sectorId: "waste_management", subSectorId: "waste_collection" }],
  "38.31": [{ sectorId: "waste_management", subSectorId: "waste_collection" }],
  "38.32": [{ sectorId: "waste_management", subSectorId: "waste_collection" }],
  // NB: 39.00 (remediation) removed — it is NACE Division E.39, not E.38.
  // NIS2 references Directive 2008/98/EC (waste management), not contaminated site cleanup.

  // ── Chemicals (Annex II) — NACE C20 ──
  "20.11": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.12": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.13": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.14": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.15": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.16": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.17": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.20": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.30": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.41": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.42": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.51": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.52": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.53": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.59": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],
  "20.60": [{ sectorId: "chemicals", subSectorId: "chemicals_manufacturing" }],

  // ── Food (Annex II) ──
  // Production & processing (WZ 10.xx, 11.xx)
  "10.11": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.12": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.13": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.20": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.31": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.32": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.39": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.41": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.42": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.51": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.52": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.61": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.62": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.71": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.72": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.73": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.81": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.82": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.83": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.84": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.85": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.86": [{ sectorId: "food", subSectorId: "food_production" }],
  "10.89": [{ sectorId: "food", subSectorId: "food_production" }],
  // NB: 10.91 (prepared animal feeds) and 10.92 (pet food) removed —
  // Reg. 178/2002 Art. 2 explicitly excludes feed from the definition of food.
  "11.01": [{ sectorId: "food", subSectorId: "food_production" }],
  "11.02": [{ sectorId: "food", subSectorId: "food_production" }],
  "11.03": [{ sectorId: "food", subSectorId: "food_production" }],
  "11.04": [{ sectorId: "food", subSectorId: "food_production" }],
  "11.05": [{ sectorId: "food", subSectorId: "food_production" }],
  "11.06": [{ sectorId: "food", subSectorId: "food_production" }],
  "11.07": [{ sectorId: "food", subSectorId: "food_production" }],
  // Wholesale distribution (WZ 46.2x, 46.3x) — actual wholesale, not agents/intermediaries
  // NB: 46.11/46.17 removed — agents/intermediaries, not wholesale distributors.
  // Also 46.11 covers non-food (textile raw materials). 46.17 includes tobacco (not food per Reg. 178/2002).
  "46.21": [{ sectorId: "food", subSectorId: "food_production" }],
  "46.22": [{ sectorId: "food", subSectorId: "food_production" }],
  "46.23": [{ sectorId: "food", subSectorId: "food_production" }],
  "46.31": [{ sectorId: "food", subSectorId: "food_production" }],
  "46.32": [{ sectorId: "food", subSectorId: "food_production" }],
  "46.33": [{ sectorId: "food", subSectorId: "food_production" }],
  "46.34": [{ sectorId: "food", subSectorId: "food_production" }],
  "46.36": [{ sectorId: "food", subSectorId: "food_production" }],
  "46.37": [{ sectorId: "food", subSectorId: "food_production" }],
  "46.38": [{ sectorId: "food", subSectorId: "food_production" }],
  // NB: 46.39 includes tobacco wholesale (not food per Reg. 178/2002) but kept
  // since the code is primarily food/beverages wholesale.
  "46.39": [{ sectorId: "food", subSectorId: "food_production" }],

  // ── Manufacturing (Annex II) ──
  // C26: Computers, electronics, optical
  "26.11": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electronics" }],
  "26.12": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electronics" }],
  "26.20": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electronics" }],
  "26.30": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electronics" }],
  "26.40": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electronics" }],
  "26.51": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electronics" }],
  "26.52": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electronics" }],
  "26.60": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electronics" }],
  "26.70": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electronics" }],
  "26.80": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electronics" }],
  // C27: Electrical equipment
  "27.11": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electrical" }],
  "27.12": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electrical" }],
  "27.20": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electrical" }],
  "27.31": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electrical" }],
  "27.32": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electrical" }],
  "27.33": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electrical" }],
  "27.40": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electrical" }],
  "27.51": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electrical" }],
  "27.52": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electrical" }],
  "27.90": [{ sectorId: "manufacturing", subSectorId: "manufacturing_electrical" }],
  // C28: Machinery
  "28.11": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.12": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.13": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.14": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.15": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.21": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.22": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.23": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.24": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.25": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.29": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.30": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.41": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.49": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.91": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.92": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.93": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.94": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.95": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.96": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  "28.99": [{ sectorId: "manufacturing", subSectorId: "manufacturing_machinery" }],
  // C29: Motor vehicles
  "29.10": [{ sectorId: "manufacturing", subSectorId: "manufacturing_vehicles" }],
  "29.20": [{ sectorId: "manufacturing", subSectorId: "manufacturing_vehicles" }],
  "29.31": [{ sectorId: "manufacturing", subSectorId: "manufacturing_vehicles" }],
  "29.32": [{ sectorId: "manufacturing", subSectorId: "manufacturing_vehicles" }],
  // C30: Other transport equipment
  "30.11": [{ sectorId: "manufacturing", subSectorId: "manufacturing_transport" }],
  "30.12": [{ sectorId: "manufacturing", subSectorId: "manufacturing_transport" }],
  "30.20": [{ sectorId: "manufacturing", subSectorId: "manufacturing_transport" }],
  "30.30": [{ sectorId: "manufacturing", subSectorId: "manufacturing_transport" }],
  "30.40": [{ sectorId: "manufacturing", subSectorId: "manufacturing_transport" }],
  "30.91": [{ sectorId: "manufacturing", subSectorId: "manufacturing_transport" }],
  "30.92": [{ sectorId: "manufacturing", subSectorId: "manufacturing_transport" }],
  "30.99": [{ sectorId: "manufacturing", subSectorId: "manufacturing_transport" }],

  // ── Digital providers (Annex II) ──
  // NB: Online marketplaces (Art. 6(12)) and social networks have no reliable WZ code —
  // they are business-model distinctions, not industry classifications.
  "63.12": [{ sectorId: "digital_providers", subSectorId: "digital_search" }],

  // ── Research (Annex II) ──
  // NB: 72.10 does not exist in WZ2008 (only in NACE Rev. 2.1), removed.
  // 72.20 (social sciences/humanities) is borderline — NIS2 targets commercial R&D.
  "72.11": [{ sectorId: "research", subSectorId: "research_applied" }],
  "72.19": [{ sectorId: "research", subSectorId: "research_applied" }],
};

export type WzNis2Match = {
  wzCode: string;
  sectorId: string;
  subSectorId?: string;
};

export function mapWzCodesToNis2(wzCodes: string[]): WzNis2Match[] {
  const matches: WzNis2Match[] = [];
  const seen = new Set<string>();

  for (const code of wzCodes) {
    const normalized = code.trim();
    const mappings = WZ_PREFIX_MAP[normalized];
    if (!mappings) continue;

    for (const mapping of mappings) {
      const key = `${mapping.sectorId}:${mapping.subSectorId ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      matches.push({
        wzCode: normalized,
        sectorId: mapping.sectorId,
        subSectorId: mapping.subSectorId,
      });
    }
  }

  return matches;
}
