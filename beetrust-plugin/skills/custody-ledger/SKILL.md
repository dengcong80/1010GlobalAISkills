---
name: custody-ledger
description: Verify a tamper-evident SHA-256 chain of custody for cross-border honey shipment events.
---

# custody-ledger

The Chain of Custody Agent creates a SHA-256 hash chain for farm, processor, warehouse and carrier events. It verifies every payload and link before a batch can proceed.

**Triggers:** `CUSTODY`, `LEDGER`, `CHAIN_OF_CUSTODY`, `TAMPER_CHECK`.

**Input:** ordered farm, processor, warehouse and carrier events with batch IDs and quantities.

**Prechecks:** require event IDs, ISO timestamps, actors, locations, actions, positive quantities and one consistent batch ID.

**Business rules:** canonicalise each event, link it to the previous SHA-256 hash, and verify payload, link, ordering and batch identity before release.

The chain is an evidence integrity layer, not a public blockchain or legal title registry. It records a reproducible head hash and the exact event IDs that fail verification.

**Runnable example:** from this skill directory, run `node scripts/run-example.mjs`. The example uses only Node.js built-ins and the local fixture.

**Output:** status, ordered events, head hash, tampered event IDs and evidence references.

**Exceptions:** empty input, invalid timestamps, duplicate IDs, wrong batch IDs or altered payloads return `BLOCKED` with the affected event IDs.

**Self-test:** `tests/cases.json` contains local pass and block fixtures covering genesis, ordering, payload tampering, link tampering, wrong batch IDs and empty input.
