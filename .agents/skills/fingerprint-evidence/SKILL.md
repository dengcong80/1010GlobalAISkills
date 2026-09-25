---
name: fingerprint-evidence
description: Validate the BeeTrust honey batch laboratory fingerprint against its reference profile and report similarity, confidence, anomalies, and evidence references.
---

# BeeTrust fingerprint-evidence

Use this skill for scientific batch identity and laboratory evidence checks.

Before acting, read the canonical instructions at `apps/web/skills/fingerprint-evidence/SKILL.md`.

Runtime implementation:

- `apps/web/src/skills/fingerprint-evidence/index.ts`
- Main function: `compareFingerprint`

The skill must return an explainable `PASS`, `REVIEW`, or `BLOCKED` result. Do not claim that the prototype replaces an accredited laboratory result, UMF licence, or MPI assurance.
