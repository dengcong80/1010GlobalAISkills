import type { MpiEvidence } from "./types.js";

export interface MarketRule {
  destination: string;
  version: string;
  officialAssuranceRequired: boolean;
  requireExportCertificate: boolean;
  requireTradeCertification: boolean;
  requireOmar: boolean;
  sourceUrls: string[];
}

export const SOURCE_REGISTRY = {
  mpiSteps: "https://www.mpi.govt.nz/export/food/honey-and-bee-products/steps-to-exporting",
  mpiRequirements: "https://www.mpi.govt.nz/export/food/honey-and-bee-products/requirements",
  mpiCertificates: "https://www.mpi.govt.nz/export/export-requirements/export-certification/animal-product-export-certificates",
  customsTariff: "https://www.customs.govt.nz/business/tariffs/tariff-classifications-and-rates",
  customsExports: "https://www.customs.govt.nz/business/export/clear-your-exports",
  customsTsw: "https://www.customs.govt.nz/business/trade-single-window-tsw/getting-started",
  ftaGuide: "https://www.mfat.govt.nz/en/trade/how-we-help-exporters/guide-to-using-free-trade-agreements-for-goods-exporters",
  comvitaInvestor: "https://comvita.co.nz/pages/investor-centre"
} as const;

export const MARKET_RULES: Record<string, MarketRule> = {
  AU: {
    destination: "Australia",
    version: "MPI-AU-2026.09",
    officialAssuranceRequired: false,
    requireExportCertificate: true,
    requireTradeCertification: true,
    requireOmar: true,
    sourceUrls: [SOURCE_REGISTRY.mpiSteps, SOURCE_REGISTRY.mpiRequirements]
  },
  CN: {
    destination: "China",
    version: "MPI-CN-2026.09",
    officialAssuranceRequired: true,
    requireExportCertificate: true,
    requireTradeCertification: true,
    requireOmar: true,
    sourceUrls: [SOURCE_REGISTRY.mpiSteps, SOURCE_REGISTRY.mpiRequirements, SOURCE_REGISTRY.mpiCertificates]
  },
  UK: {
    destination: "United Kingdom",
    version: "MPI-UK-2026.09",
    officialAssuranceRequired: true,
    requireExportCertificate: true,
    requireTradeCertification: true,
    requireOmar: true,
    sourceUrls: [SOURCE_REGISTRY.mpiSteps, SOURCE_REGISTRY.mpiRequirements, SOURCE_REGISTRY.mpiCertificates]
  },
  DEFAULT: {
    destination: "Unknown market",
    version: "MPI-DEFAULT-2026.09",
    officialAssuranceRequired: true,
    requireExportCertificate: true,
    requireTradeCertification: true,
    requireOmar: true,
    sourceUrls: [SOURCE_REGISTRY.mpiSteps, SOURCE_REGISTRY.mpiRequirements]
  }
};

export const HONEY_HS_CANDIDATES = [
  { code: "0409.00", description: "Natural honey", confidence: 0.84 },
  { code: "0409.00.90", description: "Other natural honey (national tariff extension to verify)", confidence: 0.72 }
];

export function marketRuleFor(destination: string): MarketRule {
  const aliases: Record<string, string> = { AU: "Australia", CN: "China", UK: "United Kingdom" };
  const normalisedDestination = aliases[destination.trim().toUpperCase()] ?? destination;
  const key = Object.keys(MARKET_RULES).find((candidate) => candidate !== "DEFAULT" && normalisedDestination.toLowerCase().includes(MARKET_RULES[candidate].destination.toLowerCase()));
  return key ? MARKET_RULES[key] : MARKET_RULES.DEFAULT;
}

export function expectedMpiChecks(evidence: MpiEvidence, destination: string): Array<{ id: string; label: string; required: boolean; passed: boolean; reason: string }> {
  const rule = marketRuleFor(destination);
  return [
    { id: "listed-beekeeper", label: "Listed beekeeper", required: true, passed: evidence.listedBeekeeper, reason: evidence.listedBeekeeper ? "Beekeeper evidence is present." : "Listed beekeeper evidence is missing." },
    { id: "harvest-declaration", label: "Harvest declaration", required: true, passed: evidence.harvestDeclaration, reason: evidence.harvestDeclaration ? "Harvest declaration is present." : "Harvest declaration is missing." },
    { id: "rmp", label: "Risk Management Programme (RMP)", required: true, passed: evidence.rmp, reason: evidence.rmp ? "RMP reference is present." : "RMP reference is missing." },
    { id: "omar", label: "OMAR / destination requirement", required: rule.requireOmar, passed: !rule.requireOmar || evidence.omar === "AVAILABLE" || evidence.omar === "NOT_REQUIRED", reason: evidence.omar === "AVAILABLE" || evidence.omar === "NOT_REQUIRED" ? "OMAR evidence is usable." : "OMAR evidence is missing or expired." },
    { id: "export-certificate", label: "Export certificate", required: rule.requireExportCertificate, passed: !rule.requireExportCertificate || evidence.exportCertificate, reason: evidence.exportCertificate ? "Export certificate reference is present." : "Export certificate is missing." },
    { id: "trade-certification", label: "Trade certification", required: rule.requireTradeCertification, passed: !rule.requireTradeCertification || evidence.tradeCertification, reason: evidence.tradeCertification ? "Trade certification reference is present." : "Trade certification is missing." }
  ];
}
