# customs-clearance

The Customs Trade Agent proposes HS codes, calculates a transparent case-supplied landed-cost estimate, and generates commercial invoice, packing-list and TSW-ready draft objects.

**Triggers:** `CUSTOMS`, `HS_CODE`, `INVOICE`, `PACKING_LIST`, `TSW`.

The skill can make a real HTTP availability check against the public NZ Customs tariff page when `liveSourceLookup` is enabled. It never submits to TSW. HS codes and rates remain candidates/assumptions until a broker or current tariff confirms them.

**Runnable example:** after `npm run build`, run `node skills/customs-clearance/scripts/run-example.mjs`.

**Self-test:** `src/skills/customs-clearance/tests.ts` contains 25 cases covering classification, calculations, document generation, validation, source references and draft-only behavior.
