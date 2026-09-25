---
name: trade-risk-adversary
description: Replay a controlled BeeTrust red-team fault against a cloned trade case and verify that downstream evidence monitoring produces an observable BLOCKED finding while preserving the baseline.
---

# BeeTrust trade-risk-adversary

Use this skill for Scenario B fault injection and adversarial replay.

Before acting, read the canonical instructions at `apps/web/skills/trade-risk-adversary/SKILL.md`.

Runtime implementation:

- `apps/web/src/skills/trade-risk-adversary/index.ts`
- Main functions: `ALL_FAULTS`, `injectFault`, `runAdversarySkill`

Use only the existing controlled fault catalogue, including `fingerprint-mismatch`, `batch-id-tamper`, `missing-document`, `quantity-mismatch`, `destination-change`, and `rule-version-conflict`. Clone before mutation and verify that the original case remains unchanged.
