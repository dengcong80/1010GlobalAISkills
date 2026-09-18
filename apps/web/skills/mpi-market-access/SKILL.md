# mpi-market-access

The MPI Compliance Agent evaluates destination-specific evidence for listed beekeeper status, harvest declaration, RMP, OMAR, export certificate and trade certification.

**Triggers:** `MPI`, `MARKET_ACCESS`, `OMAR`, `RMP`, `EXPORT_ASSURANCE`.

Rules are versioned snapshots with source URLs. Missing mandatory evidence, stale evidence or a rule-version conflict produces `BLOCKED`; unknown destination rules also default to a conservative block. This is a prototype decision-support layer and does not issue an MPI certificate.

**Runnable example:** after `npm run build`, run `node skills/mpi-market-access/scripts/run-example.mjs`.

**Self-test:** `src/skills/mpi-market-access/tests.ts` contains 25 cases covering markets, every mandatory document, freshness boundaries, rule conflicts, evidence references and explanations.
