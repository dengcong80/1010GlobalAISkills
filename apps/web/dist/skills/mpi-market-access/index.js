import { deterministicId } from "../../crypto.js";
import { expectedMpiChecks, marketRuleFor } from "../../rules.js";
export const TRIGGER_WORDS = ["MPI", "MARKET_ACCESS", "OMAR", "RMP", "EXPORT_ASSURANCE"];
export function checkMpiMarketAccess(destination, evidence) {
    const rule = marketRuleFor(destination);
    const evidenceBase = { destination, evidence, ruleVersion: rule.version };
    const checks = expectedMpiChecks(evidence, destination).map((check) => ({
        ...check,
        status: check.passed ? "PASS" : check.required ? "BLOCKED" : "REVIEW",
        evidenceRef: deterministicId("mpi-evidence", { ...evidenceBase, check: check.id })
    }));
    const freshnessCheck = {
        id: "evidence-freshness",
        label: "Evidence freshness",
        required: true,
        passed: evidence.evidenceFreshnessDays >= 0 && evidence.evidenceFreshnessDays <= 365,
        status: evidence.evidenceFreshnessDays >= 0 && evidence.evidenceFreshnessDays <= 365 ? "PASS" : "BLOCKED",
        reason: evidence.evidenceFreshnessDays >= 0 && evidence.evidenceFreshnessDays <= 365 ? "Evidence is within the 365-day prototype freshness window." : "Evidence is stale or has an invalid age.",
        evidenceRef: deterministicId("mpi-evidence", { ...evidenceBase, check: "freshness" })
    };
    checks.push(freshnessCheck);
    const versionConflict = evidence.ruleVersion !== undefined && evidence.ruleVersion !== rule.version;
    if (versionConflict)
        checks.push({ id: "rule-version", label: "Rule version alignment", required: true, passed: false, status: "BLOCKED", reason: `Case uses ${evidence.ruleVersion}; current snapshot is ${rule.version}.`, evidenceRef: deterministicId("mpi-evidence", { ...evidenceBase, check: "rule-version" }) });
    const missingEvidence = checks.filter((check) => !check.passed && check.required).map((check) => check.label);
    const status = missingEvidence.length > 0 ? "BLOCKED" : checks.some((check) => check.status === "REVIEW") ? "REVIEW" : "PASS";
    return {
        status,
        destination: rule.destination,
        ruleVersion: rule.version,
        checks,
        missingEvidence,
        evidenceRefs: checks.map((check) => check.evidenceRef),
        sourceUrls: rule.sourceUrls,
        disclaimer: "Rule snapshot is a decision-support prototype. Confirm current MPI destination requirements and official assurance with MPI before export."
    };
}
