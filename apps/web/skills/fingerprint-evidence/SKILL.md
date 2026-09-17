# fingerprint-evidence

The Scientific Evidence Agent parses a laboratory CSV or report extract, normalises known honey markers, compares the sample with a reference batch and returns similarity, anomalies and confidence.

**Triggers:** `FINGERPRINT`, `LAB_CSV`, `SCIENCE_CHECK`, `BATCH_SIMILARITY`.

The algorithm is deterministic and explainable: per-feature relative distance, completeness, tolerance checks, then `PASS`, `REVIEW` or `BLOCKED`. It intentionally reports a prototype triage result and never claims to replace an accredited laboratory result, a UMF licence or MPI assurance.

**Self-test:** `src/skills/fingerprint-evidence/tests.ts` contains 25 cases covering CSV formats, aliases, missing data, mismatch thresholds, evidence references and disclaimers.
