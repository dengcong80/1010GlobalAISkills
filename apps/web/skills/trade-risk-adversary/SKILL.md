# trade-risk-adversary

The Red Team Agent injects six controlled failure modes into a cloned trade case: fingerprint mismatch, custody batch tampering, missing documents, quantity mismatch, destination change and rule-version conflict.

**Triggers:** `RED_TEAM`, `FAULT_INJECT`, `ADVERSARY`, `CHAOS`, `STRESS_TEST`.

Dry-run mode records the catalogue without changing the release decision. Active faults create findings with severity and an expected `BLOCKED` gate. The original case is never mutated.

**Runnable example:** after `npm run build`, run `node skills/trade-risk-adversary/scripts/run-example.mjs`.

**Self-test:** `src/skills/trade-risk-adversary/tests.ts` contains 30 cases covering every fault, mutation isolation, severity and active/dry-run behavior.
