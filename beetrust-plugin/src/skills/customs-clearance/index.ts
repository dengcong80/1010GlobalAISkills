import { deterministicId, sha256 } from "../../crypto.js";
import { HONEY_HS_CANDIDATES, SOURCE_REGISTRY } from "../../rules.js";
import type { CustomsDocument, CustomsInput, CustomsResult } from "../../types.js";

export const TRIGGER_WORDS = ["CUSTOMS", "HS_CODE", "INVOICE", "PACKING_LIST", "TSW"] as const;

export interface TariffSnapshot {
  sourceUrl: string;
  retrievedAt: string;
  live: boolean;
  note: string;
  httpStatus?: number;
  contentHash: string;
  contentLength: number;
  markerFound: boolean;
}

export async function fetchOfficialTariffSource(live = false): Promise<TariffSnapshot> {
  if (!live) {
    const note = "Deterministic source snapshot; pass --live to retrieve and hash the current page.";
    return { sourceUrl: SOURCE_REGISTRY.customsTariff, retrievedAt: new Date().toISOString(), live: false, note, contentHash: sha256(`${SOURCE_REGISTRY.customsTariff}|snapshot`), contentLength: 0, markerFound: false };
  }
  try {
    const response = await fetch(SOURCE_REGISTRY.customsTariff, { signal: AbortSignal.timeout(5000) });
    const body = await response.text();
    const markerFound = /tariff|classification|customs/i.test(body);
    const live = response.ok && markerFound;
    return {
      sourceUrl: SOURCE_REGISTRY.customsTariff,
      retrievedAt: new Date().toISOString(),
      live,
      httpStatus: response.status,
      note: live ? `Official Customs page responded ${response.status}; content marker verified.` : `Official Customs page responded ${response.status}, but tariff content could not be verified.`,
      contentHash: sha256(body),
      contentLength: body.length,
      markerFound
    };
  } catch (error) {
    const note = `Live lookup unavailable: ${error instanceof Error ? error.message : String(error)}.`;
    return { sourceUrl: SOURCE_REGISTRY.customsTariff, retrievedAt: new Date().toISOString(), live: false, note, contentHash: sha256(note), contentLength: 0, markerFound: false };
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
  if (input.lines.length === 0) validationIssues.push("At least one commercial invoice line is required.");
  if (input.lines.some((line) => line.quantity <= 0 || line.unitValueNzd < 0 || line.netWeightKg <= 0 || !Number.isFinite(line.quantity) || !Number.isFinite(line.unitValueNzd) || !Number.isFinite(line.netWeightKg))) validationIssues.push("Every line needs positive quantity and net weight and non-negative value.");
  if (![input.freightNzd, input.insuranceNzd, input.dutyRate, input.levyRate, input.exportGstRate].every((value) => Number.isFinite(value) && value >= 0)) validationIssues.push("Freight, insurance and rates must be finite non-negative numbers.");
  if (input.liveSourceLookup && !snapshot.live) validationIssues.push("Official Customs source could not be verified live; manual tariff verification is required.");
  const documents = createDocuments(input, goodsValueNzd, estimatedLandedValueNzd, hsCandidates[0].code, snapshot);
  const blockedIssue = validationIssues.some((issue) => issue.includes("required") || issue.includes("positive") || issue.includes("finite"));
  return {
    status: validationIssues.length === 0 && input.classificationEvidence ? "PASS" : blockedIssue ? "BLOCKED" : "REVIEW",
    hsCandidates,
    totals: { goodsValueNzd, freightNzd: input.freightNzd, insuranceNzd: input.insuranceNzd, dutyNzd, levyNzd, exportGstNzd, estimatedLandedValueNzd },
    documents,
    validationIssues,
    evidenceRefs: [deterministicId("customs-evidence", { input, snapshot }), deterministicId("customs-source-snapshot", { sourceUrl: snapshot.sourceUrl, contentHash: snapshot.contentHash, live: snapshot.live })],
    sourceUrls: [SOURCE_REGISTRY.customsTariff, SOURCE_REGISTRY.customsExports, SOURCE_REGISTRY.customsTsw, SOURCE_REGISTRY.ftaGuide, ...(input.sellerSourceUrl ? [input.sellerSourceUrl] : [])],
    assumptions: ["HS code is a candidate and must be confirmed against the current tariff and broker advice.", "Rates are supplied by the case; destination taxes and preferential treatment require importer confirmation.", snapshot.note, `Tariff snapshot hash ${snapshot.contentHash} (${snapshot.contentLength} bytes; marker=${snapshot.markerFound}).`]
  };
}

function createDocuments(input: CustomsInput, goodsValueNzd: number, landedValueNzd: number, hsCode: string, snapshot: TariffSnapshot): CustomsDocument[] {
  const invoiceNumber = deterministicId("invoice", input.caseId).toUpperCase();
  const packingNumber = deterministicId("packing", input.caseId).toUpperCase();
  const invoice = { invoiceNumber, seller: input.seller, sellerSourceUrl: input.sellerSourceUrl, buyer: input.buyer, origin: input.origin, destination: input.destination, currency: input.currency, hsCodeCandidate: hsCode, lines: input.lines, goodsValueNzd, freightNzd: input.freightNzd, insuranceNzd: input.insuranceNzd, totalDeclaredValueNzd: round(goodsValueNzd + input.freightNzd + input.insuranceNzd), tariffSource: snapshot.sourceUrl, tariffSnapshotHash: snapshot.contentHash, tariffSnapshotRetrievedAt: snapshot.retrievedAt };
  const packing = { packingListNumber: packingNumber, caseId: input.caseId, packages: input.lines.map((line) => ({ sku: line.sku, quantity: line.quantity, unit: line.unit, netWeightKg: line.netWeightKg })), totalPackages: input.lines.reduce((sum, line) => sum + line.quantity, 0), totalNetWeightKg: round(input.lines.reduce((sum, line) => sum + line.netWeightKg, 0)) };
  const tsw = { messageType: "export-declaration-draft", caseId: input.caseId, seller: input.seller, destination: input.destination, hsCodeCandidate: hsCode, declaredValueNzd: invoice.totalDeclaredValueNzd, estimatedLandedValueNzd: landedValueNzd, readyForBrokerReview: true, submission: "DRAFT_ONLY" };
  return [
    { documentType: "COMMERCIAL_INVOICE", documentNumber: invoiceNumber, content: invoice, evidenceRef: deterministicId("doc", invoice) },
    { documentType: "PACKING_LIST", documentNumber: packingNumber, content: packing, evidenceRef: deterministicId("doc", packing) },
    { documentType: "TSW_DRAFT", documentNumber: deterministicId("tsw", input.caseId).toUpperCase(), content: tsw, evidenceRef: deterministicId("doc", tsw) }
  ];
}

function round(value: number): number { return Math.round(value * 100) / 100; }
