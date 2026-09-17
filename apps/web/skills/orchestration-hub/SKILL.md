# orchestration-hub

The Trade Incident Commander turns one trade sentence into a dependency-aware DAG and dispatches the six downstream roles.

**Triggers:** `ORCHESTRATE`, `TRADE_CASE`, `PLAN`, `DISPATCH`, `RETRY`.

**Input:** a natural-language export intent and a `TradeCase` identifier.

**Output:** `TaskPlan` plus `SkillMessage/v1` lifecycle messages. Every message includes `caseId`, `correlationId`, `attempt`, `status`, `payload`, and `evidenceRefs`.

**Coordination behavior:** fingerprint, custody and MPI checks can start independently; customs waits for MPI; adversary waits for all operational outputs; the evidence monitor is the final gate. Each node has two attempts and emits a retry message after a transient failure.

**Self-test:** `src/skills/orchestration-hub/tests.ts` contains 26 cases.
