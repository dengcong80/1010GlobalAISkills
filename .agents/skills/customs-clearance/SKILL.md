---
name: customs-clearance
description: Prepare candidate HS classification, landed-cost estimates, commercial documents, and draft TSW objects for the supported New Zealand-to-Australia honey case.
---

# BeeTrust customs-clearance

Use this skill for customs classification and export-document preparation after the root evidence checks complete.

Before acting, read the canonical instructions at `apps/web/skills/customs-clearance/SKILL.md`.

Runtime implementation:

- `apps/web/src/skills/customs-clearance/index.ts`
- Main functions: `runCustomsSkill`, `fetchOfficialTariffSource`

Treat HS codes, tariff rates, and TSW output as candidates or drafts until broker or current tariff confirmation. Never claim that the demo submits a TSW declaration.
