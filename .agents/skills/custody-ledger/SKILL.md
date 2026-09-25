---
name: custody-ledger
description: Build and verify the BeeTrust tamper-evident SHA-256 chain for the ordered farm, processor, warehouse, and carrier custody events.
---

# BeeTrust custody-ledger

Use this skill for chain-of-custody integrity and tamper detection.

Before acting, read the canonical instructions at `apps/web/skills/custody-ledger/SKILL.md`.

Runtime implementation:

- `apps/web/src/skills/custody-ledger/index.ts`
- Main functions: `buildHashChain`, `verifyHashChain`

When live tracing is enabled, show every custody event's `previousHash` and `hash`, followed by the final `headHash` and verification status. This is a reproducible evidence hash chain, not a public blockchain or legal title registry.
