const faultCatalogue = [
  "fingerprint-mismatch",
  "batch-id-tamper",
  "missing-mpi-document",
  "quantity-mismatch",
  "destination-change",
  "rule-version-conflict"
];
const fault = process.argv[2] || faultCatalogue[0];
const baseline = { decision: "RELEASE", score: 100, batchId: "example-batch" };
const knownFault = faultCatalogue.includes(fault);
const mutatedCase = { ...baseline, injectedFault: knownFault ? fault : null };
const finding = knownFault
  ? { code: "EVIDENCE_MONITOR_BLOCKED", severity: "HIGH", expectedDecision: "BLOCKED", evidenceRef: `red-team-${fault}` }
  : { code: "UNKNOWN_FAULT", severity: "MEDIUM", expectedDecision: "REVIEW", evidenceRef: "red-team-invalid-fault" };

console.log(JSON.stringify({
  skill: "trade-risk-adversary",
  fault,
  result: {
    status: knownFault ? "PASS" : "BLOCKED",
    activeFaults: knownFault ? [fault] : [],
    finding,
    clonedCase: mutatedCase,
    baselinePreserved: JSON.stringify(baseline) === JSON.stringify({ decision: "RELEASE", score: 100, batchId: "example-batch" })
  }
}, null, 2));
