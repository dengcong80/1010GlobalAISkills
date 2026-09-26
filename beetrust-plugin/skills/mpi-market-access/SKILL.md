---
name: mpi-market-access
description: Check New Zealand MPI market-access evidence, freshness, certificates, and rule-version consistency for the supported destination.
---

# mpi-market-access

The MPI Compliance Agent evaluates destination-specific evidence for listed beekeeper status, harvest declaration, RMP, OMAR, export certificate and trade certification.

**Triggers:** `MPI`, `MARKET_ACCESS`, `OMAR`, `RMP`, `EXPORT_ASSURANCE`.

**Input:** destination and an evidence snapshot for listed beekeeper, harvest declaration, RMP, OMAR, export certificate and trade certification.

**Prechecks:** resolve a versioned market rule, validate the declaration date/freshness and compare the evidence rule version with the active snapshot.

**Business rules:** required documents must pass; unknown destinations, stale evidence, missing OMAR and rule-version conflicts fail closed to `BLOCKED`.

Rules are versioned snapshots with source URLs. Missing mandatory evidence, stale evidence or a rule-version conflict produces `BLOCKED`; unknown destination rules also default to a conservative block. This is a prototype decision-support layer and does not issue an MPI certificate.

**Runnable example:** after `npm run build`, run `node skills/mpi-market-access/scripts/run-example.mjs`.

**Output:** check-by-check statuses, missing evidence, rule version, source URLs and evidence references.

**Exceptions:** invalid dates, negative freshness, unknown destinations and missing documents return `BLOCKED`; non-critical uncertainty returns `REVIEW`.

**Self-test:** `src/skills/mpi-market-access/tests.ts` contains 26 cases covering markets, every mandatory document, freshness boundaries, rule conflicts, evidence references and explanations.
