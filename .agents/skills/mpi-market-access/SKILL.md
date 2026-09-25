---
name: mpi-market-access
description: Check New Zealand MPI market-access evidence for the supported Australia destination, including RMP, OMAR, export certification, freshness, and rule-version consistency.
---

# BeeTrust mpi-market-access

Use this skill for destination-specific MPI compliance checks.

Before acting, read the canonical instructions at `apps/web/skills/mpi-market-access/SKILL.md`.

Runtime implementation:

- `apps/web/src/skills/mpi-market-access/index.ts`
- Main function: `checkMpiMarketAccess`

Use the versioned rule snapshot already present in the project. Missing evidence, stale evidence, rule-version conflicts, and unsupported destinations must fail closed to `BLOCKED`.
