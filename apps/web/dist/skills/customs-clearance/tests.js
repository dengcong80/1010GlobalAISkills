import { assertCase, assertEqual, runCasesAsync } from "../../test-utils.js";
import { hsCandidatesFor, runCustomsSkill } from "./index.js";
const input = { caseId: "C1", seller: "NZ Bee Co", buyer: "AU Honey Retail", origin: "New Zealand", destination: "Australia", currency: "NZD", lines: [{ sku: "MH-250", description: "UMF Mānuka honey 250g", quantity: 1000, unit: "jars", unitValueNzd: 12, netWeightKg: 250 }], freightNzd: 800, insuranceNzd: 100, dutyRate: 0, levyRate: 0.01, exportGstRate: 0, classificationEvidence: true };
export async function runTests() {
    return runCasesAsync("customs-clearance", [
        () => assertEqual(hsCandidatesFor("Mānuka honey")[0].code, "0409.00", "honey HS candidate"),
        () => assertEqual(hsCandidatesFor("tea")[0].code, "VERIFY_REQUIRED", "unknown HS candidate"),
        () => assertCase(hsCandidatesFor("honey").length >= 2, "multiple candidates"),
        () => assertCase(hsCandidatesFor("honey")[0].confidence > hsCandidatesFor("honey")[1].confidence, "candidate ranking"),
        async () => assertEqual((await runCustomsSkill(input)).status, "PASS", "valid customs input"),
        async () => assertEqual((await runCustomsSkill(input)).totals.goodsValueNzd, 12000, "goods value"),
        async () => assertEqual((await runCustomsSkill(input)).totals.dutyNzd, 0, "duty calculation"),
        async () => assertEqual((await runCustomsSkill(input)).totals.levyNzd, 120, "levy calculation"),
        async () => assertEqual((await runCustomsSkill(input)).totals.estimatedLandedValueNzd, 13020, "landed value"),
        async () => assertEqual((await runCustomsSkill(input)).documents.length, 3, "three documents"),
        async () => assertEqual((await runCustomsSkill(input)).documents[0].documentType, "COMMERCIAL_INVOICE", "invoice"),
        async () => assertEqual((await runCustomsSkill(input)).documents[1].documentType, "PACKING_LIST", "packing list"),
        async () => assertEqual((await runCustomsSkill(input)).documents[2].documentType, "TSW_DRAFT", "TSW draft"),
        async () => assertCase((await runCustomsSkill(input)).documents[2].content.submission === "DRAFT_ONLY", "no TSW submission"),
        async () => assertCase((await runCustomsSkill(input)).sourceUrls.length >= 4, "source urls"),
        async () => assertCase((await runCustomsSkill(input)).evidenceRefs[0].startsWith("customs-evidence_"), "customs evidence"),
        async () => assertEqual((await runCustomsSkill({ ...input, classificationEvidence: false })).status, "REVIEW", "classification review"),
        async () => assertCase((await runCustomsSkill({ ...input, classificationEvidence: false })).validationIssues.some((issue) => issue.includes("HS candidate")), "classification issue"),
        async () => assertEqual((await runCustomsSkill({ ...input, seller: "" })).status, "BLOCKED", "seller required"),
        async () => assertEqual((await runCustomsSkill({ ...input, lines: [{ ...input.lines[0], quantity: 0 }] })).status, "BLOCKED", "quantity required"),
        async () => assertEqual((await runCustomsSkill({ ...input, destination: "" })).status, "BLOCKED", "destination required"),
        async () => assertCase((await runCustomsSkill(input)).documents[0].evidenceRef.startsWith("doc_"), "invoice evidence"),
        async () => assertCase((await runCustomsSkill(input)).assumptions.some((item) => item.includes("candidate")), "classification assumption"),
        async () => assertCase((await runCustomsSkill({ ...input, liveSourceLookup: false })).assumptions.some((item) => item.includes("snapshot")), "snapshot note"),
        async () => assertCase((await runCustomsSkill(input)).documents[0].content.totalDeclaredValueNzd === 12900, "invoice declared value"),
        async () => assertCase((await runCustomsSkill(input)).documents[1].content.totalNetWeightKg === 250, "packing weight")
    ]);
}
