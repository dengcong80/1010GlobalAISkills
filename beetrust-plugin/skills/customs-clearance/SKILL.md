---
name: customs-clearance
description: Prepare candidate HS classification, transparent landed-cost estimates, and draft commercial documents for the supported honey export case.
---

# customs-clearance

The Customs Trade Agent proposes HS codes, calculates a transparent case-supplied landed-cost estimate, and generates commercial invoice, packing-list and TSW-ready draft objects.

**Triggers:** `CUSTOMS`, `HS_CODE`, `INVOICE`, `PACKING_LIST`, `TSW`.

**Input:** seller, buyer, origin, destination, invoice lines, freight/insurance, case-supplied rates and classification evidence.

**Prechecks:** require parties, destination, at least one positive line, finite non-negative rates and classification evidence for a `PASS` decision.

**Business rules:** honey maps to candidate HS 0409.00 entries; the tariff response is fetched, content-inspected and SHA-256 hashed in live mode; TSW output is always draft-only.

The included example uses a local versioned tariff snapshot and never requires network access or submits to TSW. HS codes and rates remain candidates/assumptions until a broker or current tariff confirms them.

**Runnable example:** from this skill directory, run `node scripts/run-example.mjs`. The example uses only Node.js built-ins and local fixtures.

**Output:** HS candidates, landed-value totals, invoice/packing/TSW draft objects, source URLs, snapshot hash and assumptions.

**Exceptions:** missing parties, invalid lines or non-finite rates return `BLOCKED`; unavailable live tariff content returns `REVIEW` with a manual verification action.

**Self-test:** `tests/cases.json` contains local pass, review and block fixtures covering classification, calculations, document generation, validation, source references and draft-only behavior.
