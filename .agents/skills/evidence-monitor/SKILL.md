---
name: evidence-monitor
description: Aggregate the six operational skill results, apply the five release gates, and emit an evidence-backed RELEASE, REVIEW, or BLOCKED decision.
---

# BeeTrust evidence-monitor

Use this skill for the final release audit and decision.

Before acting, read the canonical instructions at `apps/web/skills/evidence-monitor/SKILL.md`.

Runtime implementation:

- `apps/web/src/skills/evidence-monitor/index.ts`
- Main functions: `auditTradeCase`, `renderAuditSummary`

Require all release gates and evidence references. Any blocked upstream result or missing evidence must remain `BLOCKED`; never silently promote `REVIEW` to `RELEASE`.
