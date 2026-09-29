const destination = "Australia";
const evidence = {
  listedBeekeeper: true,
  harvestDeclaration: true,
  rmp: true,
  omar: "AVAILABLE",
  exportCertificate: true,
  tradeCertification: true,
  declarationDate: "2026-09-05",
  evidenceFreshnessDays: 12,
  ruleVersion: "MPI-AU-2026.09"
};
const requiredChecks = [
  ["listedBeekeeper", evidence.listedBeekeeper],
  ["harvestDeclaration", evidence.harvestDeclaration],
  ["rmp", evidence.rmp],
  ["omar", evidence.omar === "AVAILABLE"],
  ["exportCertificate", evidence.exportCertificate],
  ["tradeCertification", evidence.tradeCertification]
];
const missingEvidence = requiredChecks.filter(([, passed]) => !passed).map(([name]) => name);
const status = destination === "Australia" && missingEvidence.length === 0 && evidence.evidenceFreshnessDays <= 30 && evidence.ruleVersion === "MPI-AU-2026.09" ? "PASS" : "BLOCKED";

console.log(JSON.stringify({
  skill: "mpi-market-access",
  result: {
    status,
    destination,
    ruleVersion: "MPI-AU-2026.09",
    checks: requiredChecks.map(([name, passed]) => ({ name, status: passed ? "PASS" : "BLOCKED" })),
    missingEvidence,
    sourceUrls: ["https://www.mpi.govt.nz/"],
    evidenceRefs: ["mpi-market-rule-example"],
    explanation: status === "PASS" ? "All mandatory Australia evidence is present and fresh." : "Market access is blocked until required evidence is corrected."
  }
}, null, 2));
