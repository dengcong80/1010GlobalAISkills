import { assertCase, assertEqual, runCases } from "../../test-utils.js";
import { ALL_FAULTS, evaluateFault, injectFault, runAdversarySkill } from "./index.js";
const base = { caseId: "c", createdAt: "2026-09-01", intent: { raw: "", product: "Mānuka honey", destination: "Australia", origin: "New Zealand", quantity: 10, unit: "jars", priority: "normal", requestedBy: "test" }, batchId: "B1", product: "Mānuka honey", destination: "Australia", quantity: 10, unit: "jars", referenceFingerprint: { methylglyoxal: 0.6 }, sampleCsv: "methylglyoxal,0.6", referenceBatchId: "R1", custodyEvents: [{ eventId: "e1", timestamp: "2026-09-01", actor: "A", location: "NZ", action: "HARVEST", batchId: "B1", quantity: 10 }], mpiEvidence: { listedBeekeeper: true, harvestDeclaration: true, rmp: true, omar: "AVAILABLE", exportCertificate: true, tradeCertification: true, declarationDate: "2026-09-01", evidenceFreshnessDays: 1, ruleVersion: "MPI-AU-2026.09" }, customsInput: { caseId: "c", seller: "A", buyer: "B", origin: "New Zealand", destination: "Australia", currency: "NZD", lines: [{ sku: "x", description: "honey", quantity: 10, unit: "jars", unitValueNzd: 1, netWeightKg: 1 }], freightNzd: 0, insuranceNzd: 0, dutyRate: 0, levyRate: 0, exportGstRate: 0, classificationEvidence: true }, messages: [] };
export function runTests() {
    return runCases("trade-risk-adversary", [
        () => assertEqual(ALL_FAULTS.length, 6, "six faults"),
        ...ALL_FAULTS.map((fault) => () => assertEqual(evaluateFault(base, fault).expectedGate, "BLOCKED", `${fault} gate`)),
        ...ALL_FAULTS.map((fault) => () => assertCase(evaluateFault(base, fault).observed.length > 10, `${fault} observation`)),
        () => assertCase(injectFault(base, "fingerprint-mismatch").sampleCsv !== base.sampleCsv, "fingerprint mutation"),
        () => assertCase(injectFault(base, "batch-id-tamper").custodyEvents[0].batchId !== base.batchId, "batch mutation"),
        () => assertEqual(injectFault(base, "missing-document").mpiEvidence.exportCertificate, false, "document mutation"),
        () => assertEqual(injectFault(base, "quantity-mismatch").customsInput.lines[0].quantity, 11, "quantity mutation"),
        () => assertEqual(injectFault(base, "destination-change").destination, "China", "destination mutation"),
        () => assertEqual(injectFault(base, "rule-version-conflict").mpiEvidence.ruleVersion, "MPI-AU-2024.01", "version mutation"),
        () => assertEqual(runAdversarySkill(base).status, "PASS", "dry-run status"),
        () => assertEqual(runAdversarySkill(base).findings.length, 0, "dry-run inactive findings"),
        () => assertEqual(runAdversarySkill(base, ["quantity-mismatch"]).status, "BLOCKED", "active fault blocks"),
        () => assertEqual(runAdversarySkill(base, ["quantity-mismatch"]).findings.length, 1, "one active finding"),
        () => assertCase(runAdversarySkill(base, ["quantity-mismatch"]).evidenceRefs[0].startsWith("red-team-evidence_"), "red-team evidence"),
        () => assertCase(evaluateFault(base, "fingerprint-mismatch").severity === "CRITICAL", "critical fingerprint"),
        () => assertCase(evaluateFault(base, "destination-change").severity === "HIGH", "high destination"),
        () => assertCase(evaluateFault(base, "rule-version-conflict").title.includes("Rule"), "title"),
        () => assertCase(injectFault(base, "destination-change").customsInput.destination === "China", "customs destination aligned"),
        () => assertCase(injectFault(base, "destination-change").intent.destination === "China", "intent destination aligned")
    ]);
}
