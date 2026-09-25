# orchestration-hub

The Trade Incident Commander turns one trade sentence into a dependency-aware DAG and dispatches the six downstream roles.

**Triggers:** `ORCHESTRATE`, `TRADE_CASE`, `PLAN`, `DISPATCH`, `RETRY`.

**Input:** a natural-language export intent and a `TradeCase` identifier.

**Prechecks:** require a non-empty intent, parse a positive quantity, and reject a dependency cycle before dispatch.

**Business rules:** fingerprint, custody and MPI checks are independent roots; customs waits for MPI; adversary waits for all operational outputs; the monitor is the final gate. Same-level agents run concurrently and results are committed in plan order.

**Output:** `TaskPlan` plus `SkillMessage/v1` lifecycle messages. Every message includes `sender`, `receiver`, `protocol`, `taskState`, `caseId`, `correlationId`, `attempt`, `status`, `payload`, and `evidenceRefs`.

**Coordination behavior:** fingerprint, custody and MPI checks can start independently; customs waits for MPI; adversary waits for all operational outputs; the evidence monitor is the final gate. Each node has two attempts and emits a retry message after a transient failure.

**Runnable example:** after `npm run build`, run `node skills/orchestration-hub/scripts/run-example.mjs`.

**Exceptions:** missing handlers and unresolved dependency cycles fail the run; a handler gets one retry and then emits `TASK_FAILED`.

**Self-test:** `src/skills/orchestration-hub/tests.ts` contains 36 cases covering parsing, DAG dependencies, parallel roots, retry budget, trigger routing and cycle-safe execution.
