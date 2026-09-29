---
name: fingerprint-evidence
description: Compare laboratory honey markers with a reference profile and return similarity, confidence, anomalies, and a fail-closed status.
---

# fingerprint-evidence

The Scientific Evidence Agent parses a laboratory CSV or report extract, normalises known honey markers, compares the sample with a reference batch and returns similarity, anomalies and confidence.

**Triggers:** `FINGERPRINT`, `LAB_CSV`, `SCIENCE_CHECK`, `BATCH_SIMILARITY`.

**Input:** a batch ID, laboratory CSV/report extract, reference marker map and reference batch ID.

**Prechecks:** require a batch ID, reference batch ID and at least one parseable numeric marker; reject duplicate or non-finite values.

**Business rules:** normalise marker aliases, calculate per-feature relative distance, apply tolerance and completeness thresholds, then classify `PASS`, `REVIEW` or `BLOCKED`.

The algorithm is deterministic and explainable: per-feature relative distance, completeness, tolerance checks, then `PASS`, `REVIEW` or `BLOCKED`. It intentionally reports a prototype triage result and never claims to replace an accredited laboratory result, a UMF licence or MPI assurance.

**Runnable example:** from this skill directory, run `node scripts/run-example.mjs`. The example uses only Node.js built-ins and the local reference fixture.

**Output:** marker features, similarity, confidence, anomaly labels, evidence references and a limitation disclaimer.

**Exceptions:** malformed CSV, missing markers and non-finite values return `BLOCKED` with a deterministic evidence reference; borderline tolerance returns `REVIEW`.

**Self-test:** `tests/cases.json` contains local pass, review and block fixtures covering CSV formats, aliases, missing data, mismatch thresholds, evidence references and disclaimers.
