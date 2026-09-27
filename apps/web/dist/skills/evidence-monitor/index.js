export const TRIGGER_WORDS = ["AUDIT", "RELEASE", "REVIEW", "BLOCK", "EVIDENCE_MATRIX"];
export function auditTradeCase(tradeCase) {
    const gates = [];
    const missingEvidence = [];
    const evidenceMatrix = {};
    const addGate = (gate, status, evidenceRefs, reason) => {
        gates.push({ gate, status, evidenceRefs, reason });
        evidenceMatrix[gate] = evidenceRefs;
        if (evidenceRefs.length === 0)
            missingEvidence.push(`${gate}: no evidence reference`);
    };
    addGate("scientific-fingerprint", tradeCase.fingerprint?.status ?? "BLOCKED", tradeCase.fingerprint?.evidenceRefs ?? [], tradeCase.fingerprint?.anomalies.length ? tradeCase.fingerprint.anomalies.join("; ") : "Reference comparison completed.");
    addGate("chain-of-custody", tradeCase.custody?.status ?? "BLOCKED", tradeCase.custody?.evidenceRefs ?? [], tradeCase.custody?.tamperedEventIds.length ? `Tampered events: ${tradeCase.custody.tamperedEventIds.join(", ")}` : "Hash chain verified.");
    addGate("mpi-market-access", tradeCase.mpi?.status ?? "BLOCKED", tradeCase.mpi?.evidenceRefs ?? [], tradeCase.mpi?.missingEvidence.join("; ") || "Destination rule checks passed.");
    addGate("customs-clearance", tradeCase.customs?.status ?? "BLOCKED", tradeCase.customs?.evidenceRefs ?? [], tradeCase.customs?.validationIssues.join("; ") || "Documents and estimate generated.");
    const adversary = tradeCase.adversary;
    const adversaryStatus = !adversary ? "BLOCKED" : adversary.activeFaults.length ? "BLOCKED" : "PASS";
    addGate("adversarial-stress", adversaryStatus, adversary?.evidenceRefs ?? [], adversary?.activeFaults.length ? `Active faults: ${adversary.activeFaults.join(", ")}` : "No active faults in baseline case.");
    const blocked = gates.some((gate) => gate.status === "BLOCKED");
    const review = gates.some((gate) => gate.status === "REVIEW");
    const decision = blocked ? "BLOCKED" : review ? "REVIEW" : "RELEASE";
    const score = Math.max(0, Math.round(100 - gates.filter((gate) => gate.status === "BLOCKED").length * 25 - gates.filter((gate) => gate.status === "REVIEW").length * 10 - missingEvidence.length * 5));
    return { decision, score, gates, missingEvidence, nextActions: nextActionsFor(decision, gates), evidenceMatrix };
}
function nextActionsFor(decision, gates) {
    if (decision === "RELEASE")
        return ["Release to broker review with the evidence bundle.", "Retain source snapshots, hashes and generated drafts with the case."];
    return gates.filter((gate) => gate.status !== "PASS").map((gate) => `Resolve ${gate.gate}: ${gate.reason}`);
}
export function renderAuditSummary(result) {
    return [`Decision: ${result.decision}`, `Score: ${result.score}/100`, ...result.gates.map((gate) => `${gate.status.padEnd(7)} ${gate.gate} (${gate.evidenceRefs.length} evidence refs)`), "Next actions:", ...result.nextActions.map((action) => `- ${action}`)].join("\n");
}
