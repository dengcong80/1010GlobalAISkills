import { runTests as runOrchestrationTests } from "./skills/orchestration-hub/tests.js";
import { runTests as runFingerprintTests } from "./skills/fingerprint-evidence/tests.js";
import { runTests as runCustodyTests } from "./skills/custody-ledger/tests.js";
import { runTests as runMpiTests } from "./skills/mpi-market-access/tests.js";
import { runTests as runCustomsTests } from "./skills/customs-clearance/tests.js";
import { runTests as runAdversaryTests } from "./skills/trade-risk-adversary/tests.js";
import { runTests as runMonitorTests } from "./skills/evidence-monitor/tests.js";
import type { TestSummary } from "./test-utils.js";

export async function runAllSelfTests(): Promise<TestSummary[]> {
  return [runOrchestrationTests(), runFingerprintTests(), runCustodyTests(), runMpiTests(), await runCustomsAsync(), runAdversaryTests(), runMonitorTests()];
}

async function runCustomsAsync(): Promise<TestSummary> {
  return runCustomsTests();
}
