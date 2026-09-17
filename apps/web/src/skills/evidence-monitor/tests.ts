import { assertCase, assertEqual, runCases, type TestSummary } from "../../test-utils.js";
import { auditTradeCase, renderAuditSummary } from "./index.js";
import type { TradeCase } from "../../types.js";

const pass = (status: "PASS" | "REVIEW" | "BLOCKED", refs = ["evidence_1"]): any => ({ status, evidenceRefs: refs, anomalies: [], tamperedEventIds: [], missingEvidence: [], validationIssues: [], activeFaults: [] });
const base = { fingerprint: pass("PASS"), custody: pass("PASS"), mpi: pass("PASS"), customs: pass("PASS"), adversary: pass("PASS") } as unknown as TradeCase;

export function runTests(): TestSummary {
  return runCases("evidence-monitor", [
    () => assertEqual(auditTradeCase(base).decision, "RELEASE", "all pass"),
    () => assertEqual(auditTradeCase(base).score, 100, "perfect score"),
    () => assertEqual(auditTradeCase({ ...base, fingerprint: pass("BLOCKED") }).decision, "BLOCKED", "blocked fingerprint"),
    () => assertEqual(auditTradeCase({ ...base, custody: pass("BLOCKED") }).decision, "BLOCKED", "blocked custody"),
    () => assertEqual(auditTradeCase({ ...base, mpi: pass("BLOCKED") }).decision, "BLOCKED", "blocked MPI"),
    () => assertEqual(auditTradeCase({ ...base, customs: pass("BLOCKED") }).decision, "BLOCKED", "blocked customs"),
    () => assertEqual(auditTradeCase({ ...base, fingerprint: pass("REVIEW") }).decision, "REVIEW", "review fingerprint"),
    () => assertEqual(auditTradeCase({ ...base, adversary: { ...pass("PASS"), activeFaults: ["quantity-mismatch"] } }).decision, "BLOCKED", "active fault blocks"),
    () => assertCase(auditTradeCase({ ...base, fingerprint: pass("BLOCKED") }).score < 100, "blocked lowers score"),
    () => assertCase(auditTradeCase({ ...base, fingerprint: pass("REVIEW") }).score < 100, "review lowers score"),
    () => assertCase(auditTradeCase(base).gates.length === 5, "five gates"),
    () => assertCase(auditTradeCase(base).evidenceMatrix["scientific-fingerprint"].length === 1, "matrix ref"),
    () => assertCase(auditTradeCase({ ...base, fingerprint: pass("BLOCKED", []) }).missingEvidence.length > 0, "missing evidence"),
    () => assertCase(auditTradeCase({ ...base, fingerprint: undefined }).missingEvidence.some((item) => item.includes("scientific")), "missing stage"),
    () => assertCase(auditTradeCase(base).nextActions.length === 2, "release actions"),
    () => assertCase(auditTradeCase({ ...base, mpi: pass("REVIEW") }).nextActions.some((action) => action.includes("mpi")), "review action"),
    () => assertCase(renderAuditSummary(auditTradeCase(base)).includes("Decision: RELEASE"), "summary decision"),
    () => assertCase(renderAuditSummary(auditTradeCase(base)).includes("scientific-fingerprint"), "summary gate"),
    () => assertCase(renderAuditSummary(auditTradeCase(base)).includes("evidence refs"), "summary refs"),
    () => assertCase(renderAuditSummary(auditTradeCase({ ...base, customs: pass("BLOCKED") })).includes("BLOCKED"), "summary block"),
    () => assertCase(auditTradeCase(base).gates.every((gate) => gate.reason.length > 0), "gate reason"),
    () => assertCase(auditTradeCase(base).gates.every((gate) => gate.evidenceRefs.length > 0), "gate refs"),
    () => assertCase(auditTradeCase(base).evidenceMatrix["adversarial-stress"].length > 0, "adversary matrix"),
    () => assertCase(auditTradeCase({ ...base, adversary: undefined }).decision === "BLOCKED", "missing adversary stage"),
    () => assertCase(auditTradeCase({ ...base, fingerprint: pass("REVIEW"), mpi: pass("BLOCKED") }).decision === "BLOCKED", "blocked dominates review")
  ]);
}
