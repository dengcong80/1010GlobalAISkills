# trade-risk-adversary

The Red Team Agent injects six controlled failure modes into a cloned trade case: fingerprint mismatch, custody batch tampering, missing documents, quantity mismatch, destination change and rule-version conflict.

**Triggers:** `RED_TEAM`, `FAULT_INJECT`, `ADVERSARY`, `CHAOS`, `STRESS_TEST`.

**Input:** a complete `TradeCase` and zero or more fault names from the controlled catalogue.

**Prechecks:** clone the case before mutation and reject unknown fault names; the source case remains immutable.

**Business rules:** inject scientific mismatch, custody tamper, missing documents, quantity mismatch, destination change and rule-version conflict; every active fault must produce an observable `BLOCKED` finding.

Dry-run mode records the catalogue without changing the release decision. Active faults create findings with severity and an expected `BLOCKED` gate. The original case is never mutated.

**Runnable example:** after `npm run build`, run `node skills/trade-risk-adversary/scripts/run-example.mjs`.

**Output:** active faults, findings, severity, expected gate and a red-team evidence reference.

**Exceptions:** unknown fault names and missing mutable fields are reported as controlled findings; no mutation is applied to the original case.

**Self-test:** `src/skills/trade-risk-adversary/tests.ts` contains 29 cases covering every fault, mutation isolation, severity and active/dry-run behavior.
