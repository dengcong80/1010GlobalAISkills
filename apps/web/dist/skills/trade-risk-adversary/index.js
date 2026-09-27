import { deepClone, deterministicId } from "../../crypto.js";
export const TRIGGER_WORDS = ["RED_TEAM", "FAULT_INJECT", "ADVERSARY", "CHAOS", "STRESS_TEST"];
export const ALL_FAULTS = ["fingerprint-mismatch", "batch-id-tamper", "missing-document", "quantity-mismatch", "destination-change", "rule-version-conflict"];
export function injectFault(tradeCase, fault) {
    const mutated = deepClone(tradeCase);
    switch (fault) {
        case "fingerprint-mismatch":
            mutated.sampleCsv = mutated.sampleCsv.replace(/methylglyoxal[,;:\t]\s*-?\d+(?:\.\d+)?/i, "methylglyoxal,9.99");
            break;
        case "batch-id-tamper":
            if (mutated.custodyEvents[0])
                mutated.custodyEvents[0].batchId = `${mutated.batchId}-TAMPERED`;
            break;
        case "missing-document":
            mutated.mpiEvidence.exportCertificate = false;
            mutated.mpiEvidence.harvestDeclaration = false;
            break;
        case "quantity-mismatch":
            if (mutated.customsInput.lines[0])
                mutated.customsInput.lines[0].quantity += 1;
            break;
        case "destination-change":
            mutated.destination = "China";
            mutated.intent.destination = "China";
            mutated.customsInput.destination = "China";
            break;
        case "rule-version-conflict":
            mutated.mpiEvidence.ruleVersion = "MPI-AU-2024.01";
            break;
    }
    return mutated;
}
export function evaluateFault(tradeCase, fault) {
    const mutated = injectFault(tradeCase, fault);
    const observations = {
        "fingerprint-mismatch": mutated.sampleCsv !== tradeCase.sampleCsv ? "Sample marker vector was changed." : "Marker mutation could not be applied.",
        "batch-id-tamper": mutated.custodyEvents[0]?.batchId !== tradeCase.custodyEvents[0]?.batchId ? "First custody event references a different batch." : "Custody mutation could not be applied.",
        "missing-document": !mutated.mpiEvidence.exportCertificate || !mutated.mpiEvidence.harvestDeclaration ? "Mandatory MPI documents were removed." : "Document mutation could not be applied.",
        "quantity-mismatch": mutated.customsInput.lines[0]?.quantity !== tradeCase.customsInput.lines[0]?.quantity ? "Invoice quantity diverges from the case quantity." : "Quantity mutation could not be applied.",
        "destination-change": mutated.destination !== tradeCase.destination ? "Destination changed after planning." : "Destination mutation could not be applied.",
        "rule-version-conflict": mutated.mpiEvidence.ruleVersion !== tradeCase.mpiEvidence.ruleVersion ? "Case rule version no longer matches the market snapshot." : "Rule mutation could not be applied."
    };
    return { fault, title: fault.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), severity: fault === "destination-change" || fault === "rule-version-conflict" ? "HIGH" : "CRITICAL", observed: observations[fault], expectedGate: "BLOCKED" };
}
export function runAdversarySkill(tradeCase, activeFaults = []) {
    const findings = (activeFaults.length ? activeFaults : ALL_FAULTS).map((fault) => evaluateFault(tradeCase, fault));
    const active = activeFaults.length > 0;
    return { status: active ? "BLOCKED" : "PASS", activeFaults, findings: active ? findings : [], evidenceRefs: [deterministicId("red-team-evidence", { caseId: tradeCase.caseId, activeFaults, catalogue: findings })] };
}
