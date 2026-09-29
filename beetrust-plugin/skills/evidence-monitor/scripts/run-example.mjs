const blocked = process.argv.includes("--tamper");
const gates = [
  { name: "fingerprint", status: blocked ? "BLOCKED" : "PASS", evidenceRefs: ["fingerprint-evidence-example"] },
  { name: "custody", status: "PASS", evidenceRefs: ["custody-evidence-example"] },
  { name: "mpi", status: "PASS", evidenceRefs: ["mpi-market-rule-example"] },
  { name: "customs", status: "PASS", evidenceRefs: ["customs-snapshot-example"] },
  { name: "adversary", status: blocked ? "BLOCKED" : "PASS", evidenceRefs: ["red-team-example"] }
];
const decision = gates.some((gate) => gate.status === "BLOCKED") ? "BLOCKED" : "RELEASE";
const score = decision === "RELEASE" ? 100 : 60;

console.log(JSON.stringify({
  skill: "evidence-monitor",
  baseline: { decision, score, gates, evidenceCoverage: gates.every((gate) => gate.evidenceRefs.length > 0) ? "100%" : "INCOMPLETE" },
  releaseGates: gates,
  nextActions: decision === "RELEASE" ? ["Release to broker review."] : ["Quarantine the case.", "Preserve the baseline evidence.", "Investigate the blocked gate."]
}, null, 2));
