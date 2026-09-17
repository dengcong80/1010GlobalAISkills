import { deterministicId } from "../../crypto.js";
import { HONEY_HS_CANDIDATES, SOURCE_REGISTRY } from "../../rules.js";
import type { CustomsDocument, CustomsInput, CustomsResult } from "../../types.js";

export const TRIGGER_WORDS = ["CUSTOMS", "HS_CODE", "INVOICE", "PACKING_LIST", "TSW"] as const;

export interface TariffSnapshot {
  sourceUrl: string;
  retrievedAt: string;
  live: boolean;
  note: string;
}

export async function fetchOfficialTariffSource(live = false): Promise<TariffSnapshot> {
  if (!live) return { sourceUrl: SOURCE_REGISTRY.customsTariff, retrievedAt: new Date().toISOString(), live: false, note: "Deterministic source snapshot; pass --live to verify page availability." };
  try {
    const response = await fetch(SOURCE_REGISTRY.customsTariff, { signal: AbortSignal.timeout(5000) });
    return { sourceUrl: SOURCE_REGISTRY.customsTariff, retrievedAt: new Date().toISOString(), live: response.ok, note: response.ok ? `Official Customs page responded ${response.status}.` : `Official Customs page responded ${response.status}; manual verification required.` };
  } catch (error) {
    return { sourceUrl: SOURCE_REGISTRY.customsTariff, retrievedAt: new Date().toISOString(), live: false, note: `Live lookup unavailable: ${error instanceof Error ? error.message : String(error)}.` };
  }
}

export function hsCandidatesFor(product: string): Array<{ code: string; description: string; confidence: number }> {
  return /honey|m[aā]nuka/i.test(product) ? HONEY_HS_CANDIDATES : [{ code: "VERIFY_REQUIRED", description: "Product-specific classification requires broker review", confidence: 0.2 }];
}

export async function runCustomsSkill(input: CustomsInput): Promise<CustomsResult> {
  const snapshot = await fetchOfficialTariffSource(input.liveSourceLookup ?? false);
  const hsCandidates = hsCandidatesFor(input.lines.map((line) => line.description).join(" "));
  const goodsValueNzd = round(input.lines.reduce((sum, line) => sum + line.quantity * line.unitValueNzd, 0));
  const dutyNzd = round(goodsValueNzd * input.dutyRate);
  const levyNzd = round(goodsValueNzd * input.levyRate);
  const exportGstNzd = round((goodsValueNzd + input.freightNzd + input.insuranceNzd + dutyNzd + levyNzd) * input.exportGstRate);
  const estimatedLandedValueNzd = round(goodsValueNzd + input.freightNzd + input.insuranceNzd + dutyNzd + levyNzd + exportGstNzd);
  const validationIssues: string[] = [];
  if (!input.seller || !input.buyer) validationIssues.push("Seller and buyer are required on the commercial invoice.");
  if (!input.destination) validationIssues.push("Destination is required.");
  if (!input.classificationEvidence) validationIssues.push("HS candidate is not supported by broker or tariff evidence.");
  if (input.lines.some((line) => line.quantity <= 0 || line.unitValueNzd < 0 || line.netWeightKg <= 0)) validationIssues.push("Every line needs positive quantity and net weight and non-negative value.");
  const documents = createDocuments(input, goodsValueNzd, estimatedLandedValueNzd, hsCandidates[0].code, snapshot);
  return {
    status: validationIssues.length === 0 && input.classificationEvidence ? "PASS" : validationIssues.some((issue) => issue.includes("required") || issue.includes("positive")) ? "BLOCKED" : "REVIEW",
    hsCandidates,
    totals: { goodsValueNzd, freightNzd: input.freightNzd, insuranceNzd: input.insuranceNzd, dutyNzd, levyNzd, exportGstNzd, estimatedLandedValueNzd },
    documents,
    validationIssues,
    evidenceRefs: [deterministicId("customs-evidence", { input, snapshot })],
    sourceUrls: [SOURCE_REGISTRY.customsTariff, SOURCE_REGISTRY.customsExports, SOURCE_REGISTRY.customsTsw, SOURCE_REGISTRY.ftaGuide, ...(input.sellerSourceUrl ? [input.sellerSourceUrl] : [])],
    assumptions: ["HS code is a candidate and must be confirmed against the current tariff and broker advice.", "Rates are supplied by the case; destination taxes and preferential treatment require importer confirmation.", snapshot.note]
  };
}

function createDocuments(input: CustomsInput, goodsValueNzd: number, landedValueNzd: number, hsCode: string, snapshot: TariffSnapshot): CustomsDocument[] {
  const invoiceNumber = deterministicId("invoice", input.caseId).toUpperCase();
  const packingNumber = deterministicId("packing", input.caseId).toUpperCase();
  const invoice = { invoiceNumber, seller: input.seller, sellerSourceUrl: input.sellerSourceUrl, buyer: input.buyer, origin: input.origin, destination: input.destination, currency: input.currency, hsCodeCandidate: hsCode, lines: input.lines, goodsValueNzd, freightNzd: input.freightNzd, insuranceNzd: input.insuranceNzd, totalDeclaredValueNzd: round(goodsValueNzd + input.freightNzd + input.insuranceNzd), tariffSource: snapshot.sourceUrl };
  const packing = { packingListNumber: packingNumber, caseId: input.caseId, packages: input.lines.map((line) => ({ sku: line.sku, quantity: line.quantity, unit: line.unit, netWeightKg: line.netWeightKg })), totalPackages: input.lines.reduce((sum, line) => sum + line.quantity, 0), totalNetWeightKg: round(input.lines.reduce((sum, line) => sum + line.netWeightKg, 0)) };
  const tsw = { messageType: "export-declaration-draft", caseId: input.caseId, seller: input.seller, destination: input.destination, hsCodeCandidate: hsCode, declaredValueNzd: invoice.totalDeclaredValueNzd, estimatedLandedValueNzd: landedValueNzd, readyForBrokerReview: true, submission: "DRAFT_ONLY" };
  return [
    { documentType: "COMMERCIAL_INVOICE", documentNumber: invoiceNumber, content: invoice, evidenceRef: deterministicId("doc", invoice) },
    { documentType: "PACKING_LIST", documentNumber: packingNumber, content: packing, evidenceRef: deterministicId("doc", packing) },
    { documentType: "TSW_DRAFT", documentNumber: deterministicId("tsw", input.caseId).toUpperCase(), content: tsw, evidenceRef: deterministicId("doc", tsw) }
  ];
}

function round(value: number): number { return Math.round(value * 100) / 100; }
