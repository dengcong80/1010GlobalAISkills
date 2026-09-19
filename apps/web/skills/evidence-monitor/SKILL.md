# evidence-monitor

The Release Auditor Agent applies a single evidence matrix over all six operational roles and emits `RELEASE`, `REVIEW` or `BLOCKED` with a score, reasons and next actions.

**Triggers:** `AUDIT`, `RELEASE`, `REVIEW`, `BLOCK`, `EVIDENCE_MATRIX`.

**Input:** outputs from the six operational roles, each with a status and evidence references.

**Prechecks:** require all five release gates and at least one evidence reference per passing gate.

**Business rules:** any blocked upstream gate or missing evidence blocks release; review remains review; only a complete, fault-free evidence matrix can emit `RELEASE`.

Any missing evidence reference or blocked upstream gate blocks release. Review states remain visible rather than being silently promoted. The output is a release recommendation for human/broker review.

**Runnable example:** after `npm run build`, run `node skills/evidence-monitor/scripts/run-example.mjs`.

**Output:** release decision, score, five gates, evidence matrix, missing evidence and next actions.

**Exceptions:** missing role output becomes a blocked gate with an actionable reason; review gates never get promoted by score alone.

**Self-test:** `src/skills/evidence-monitor/tests.ts` contains 25 cases covering gate precedence, evidence completeness, score changes, matrix output and action generation.
