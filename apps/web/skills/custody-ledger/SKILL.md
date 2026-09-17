# custody-ledger

The Chain of Custody Agent creates a SHA-256 hash chain for farm, processor, warehouse and carrier events. It verifies every payload and link before a batch can proceed.

**Triggers:** `CUSTODY`, `LEDGER`, `CHAIN_OF_CUSTODY`, `TAMPER_CHECK`.

The chain is an evidence integrity layer, not a public blockchain or legal title registry. It records a reproducible head hash and the exact event IDs that fail verification.

**Self-test:** `src/skills/custody-ledger/tests.ts` contains 25 cases covering genesis, ordering, payload tampering, link tampering, wrong batch IDs and empty input.
