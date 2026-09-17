# SP-A implementation and judging map

## Why this is a credible business case

The product is a trade-release control room for a New Zealand honey exporter. A shipment cannot be released because a language model sounds confident; it needs linked scientific evidence, custody integrity, destination rules and customs documents. The design turns that operational risk into a measurable business workflow: fewer manual document checks, faster broker hand-off, an auditable reason for every hold, and a repeatable stress test before a shipment leaves the warehouse.

## Engineering complexity

- A dependency-aware DAG has three independent root agents, ten collaboration edges, a four-stage critical path and retry messages.
- All roles exchange `SkillMessage/v1` with correlation IDs, attempts, statuses and evidence references.
- The fingerprint algorithm handles structured CSV/report input, feature aliases, completeness, tolerances, distance, similarity and confidence.
- The custody role uses canonical JSON and SHA-256 chaining, then detects payload, link, order and batch tampering.
- MPI rules are versioned by destination and conservative by default; stale evidence and rule conflicts are explicit blocked gates.
- Customs generation creates three document objects, costs and assumptions, and can perform a live public Customs page availability check.
- The red team runs six controlled fault injections against cloned cases; the auditor recomputes the decision from evidence rather than trusting agent prose.

## Depth of distillation

The final monitor compresses hundreds of potential facts into five gates, an evidence matrix, a 0–100 score, a release state and next actions. Every gate retains a reason and evidence reference, so a judge can drill back from the final decision to the responsible role and source URL.

## Seven-day build plan for two people

1. Day 1: freeze the case schema, trigger registry, source registry and happy-path fixture.
2. Day 2: implement the orchestration DAG, shared messages, retries and runtime timeline.
3. Day 3: implement fingerprint comparison and custody hash chain with tamper fixtures.
4. Day 4: implement MPI rule snapshots and customs document/cost generation.
5. Day 5: implement red-team faults and evidence monitor; add at least 20 cases per skill.
6. Day 6: build the dashboard, record the demo path and test `npm test`, `npm run demo` and `npm run demo:live`.
7. Day 7: replace synthetic evidence with permissioned sample files, rehearse the 90-second story and package the source, screenshots and limitations.

Suggested split: Person A owns orchestration, MPI, customs and dashboard; Person B owns fingerprint, custody, adversary, monitor and test fixtures. Integrate at the shared `TradeCase` and `SkillMessage/v1` boundary at the end of Day 2.

## Demo script

1. Run `npm run demo` and show the `RELEASE (100/100)` baseline.
2. Open `dist/beetrust-dashboard.html` and point to the DAG, five gates and message timeline.
3. Show the generated invoice, packing list and TSW draft are reviewable objects, not a false submission.
4. Walk through the six red-team rows; each produces `BLOCKED` with a different observable reason.
5. Change one input (for example, remove the harvest declaration) and rerun to show deterministic hold behavior.

The demo fixture is synthetic and names Comvita Limited only as a publicly verifiable case owner. It is not evidence that Comvita made the shipment. Production use needs accredited laboratory records, current MPI destination requirements, broker-confirmed tariff classification and authorised exporter credentials.
