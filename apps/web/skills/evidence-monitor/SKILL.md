# evidence-monitor

The Release Auditor Agent applies a single evidence matrix over all six operational roles and emits `RELEASE`, `REVIEW` or `BLOCKED` with a score, reasons and next actions.

**Triggers:** `AUDIT`, `RELEASE`, `REVIEW`, `BLOCK`, `EVIDENCE_MATRIX`.

Any missing evidence reference or blocked upstream gate blocks release. Review states remain visible rather than being silently promoted. The output is a release recommendation for human/broker review.

**Self-test:** `src/skills/evidence-monitor/tests.ts` contains 25 cases covering gate precedence, evidence completeness, score changes, matrix output and action generation.
