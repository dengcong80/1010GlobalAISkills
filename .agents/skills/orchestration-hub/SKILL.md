---
name: orchestration-hub
description: Orchestrate a BeeTrust trade case by parsing the supported export intent, creating the dependency-aware DAG, and dispatching the six downstream skills in the required order.
---

# BeeTrust orchestration-hub

Use this skill when the task asks Codex to run, inspect, explain, or validate the BeeTrust multi-agent trade workflow.

Before acting, read the canonical instructions at `apps/web/skills/orchestration-hub/SKILL.md`.

Runtime implementation:

- `apps/web/src/skills/orchestration-hub/index.ts`
- `apps/web/src/workflow.ts`
- `apps/web/src/framework-runtime.ts`

Required execution order:

1. Create the DAG.
2. Start `fingerprint-evidence`, `custody-ledger`, and `mpi-market-access` in parallel.
3. Wait for all three root agents.
4. Run `customs-clearance`.
5. Run `trade-risk-adversary`.
6. Run `evidence-monitor`.
7. Return `RELEASE`, `REVIEW`, or `BLOCKED`.

Use the supported Australia happy-path fixture unless an existing test fixture is explicitly requested. Preserve `SkillMessage/v1`, including `sender`, `receiver`, `protocol`, and `taskState`, and do not redesign the TypeScript API.
