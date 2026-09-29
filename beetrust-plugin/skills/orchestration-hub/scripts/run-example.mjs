const raw = process.argv.slice(2).join(" ") || "Release 1000 jars of UMF Mānuka honey from New Zealand to Australia for AU retail review.";
const quantityMatch = raw.match(/(\d+)\s+jars?/i);
const quantity = quantityMatch ? Number(quantityMatch[1]) : null;
const intent = {
  raw,
  quantity,
  product: /mānuka honey/i.test(raw) ? "UMF Mānuka honey" : "honey",
  origin: /new zealand/i.test(raw) ? "New Zealand" : null,
  destination: /australia/i.test(raw) ? "Australia" : null
};
const taskPlan = {
  caseId: "example-case",
  protocol: "SkillMessage/v1",
  levels: [
    ["fingerprint-evidence", "custody-ledger", "mpi-market-access"],
    ["customs-clearance"],
    ["trade-risk-adversary"],
    ["evidence-monitor"]
  ],
  dependencies: {
    "customs-clearance": ["mpi-market-access"],
    "trade-risk-adversary": ["fingerprint-evidence", "custody-ledger", "mpi-market-access", "customs-clearance"],
    "evidence-monitor": ["fingerprint-evidence", "custody-ledger", "mpi-market-access", "customs-clearance", "trade-risk-adversary"]
  }
};
const messages = taskPlan.levels.flat().map((skill, index) => ({
  sender: "orchestration-hub",
  receiver: skill,
  protocol: "SkillMessage/v1",
  taskState: "TASK_CREATED",
  caseId: "example-case",
  correlationId: "example-correlation",
  attempt: 1,
  status: "READY",
  payload: { sequence: index + 1 },
  evidenceRefs: []
}));

console.log(JSON.stringify({ skill: "orchestration-hub", intent, taskPlan, messages }, null, 2));
