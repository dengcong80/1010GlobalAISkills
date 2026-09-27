import { assertCase, assertEqual, runCases } from "../../test-utils.js";
import { buildHashChain, runCustodySkill, verifyHashChain } from "./index.js";
const event = (id, quantity = 1000) => ({ eventId: id, timestamp: `2026-09-${id === "a" ? "01" : "02"}T00:00:00Z`, actor: "NZ Bee Co", location: id === "a" ? "Waikato" : "Auckland", action: id === "a" ? "HARVEST" : "PACK", batchId: "B1", quantity });
export function runTests() {
    return runCases("custody-ledger", [
        () => assertEqual(buildHashChain([]).status, "PASS", "empty chain is structurally valid"),
        () => assertEqual(buildHashChain([event("a")]).events.length, 1, "one event"),
        () => assertEqual(buildHashChain([event("a"), event("b")]).events[1].previousHash, buildHashChain([event("a")]).headHash, "link points to previous"),
        () => assertEqual(buildHashChain([event("a")]).events[0].previousHash, "GENESIS", "genesis"),
        () => assertCase(buildHashChain([event("a")]).events[0].hash.length === 64, "sha256 length"),
        () => assertEqual(buildHashChain([event("a")]).tamperedEventIds.length, 0, "new chain clean"),
        () => assertEqual(buildHashChain([event("a")]).status, "PASS", "new chain pass"),
        () => assertEqual(runCustodySkill("B1", [event("a")]).status, "PASS", "skill pass"),
        () => assertEqual(runCustodySkill("B1", []).status, "BLOCKED", "missing events block"),
        () => assertEqual(runCustodySkill("", [event("a")]).status, "BLOCKED", "missing batch blocks"),
        () => assertEqual(runCustodySkill("B2", [event("a")]).status, "BLOCKED", "wrong batch blocks"),
        () => assertCase(runCustodySkill("B1", [event("a"), event("b")]).evidenceRefs[0].startsWith("custody-evidence_"), "evidence ref"),
        () => { const chain = buildHashChain([event("a")]); assertCase(verifyHashChain(chain.events).valid, "verification valid"); },
        () => { const chain = buildHashChain([event("a"), event("b")]); chain.events[0].quantity = 999; assertCase(!verifyHashChain(chain.events).valid, "payload tamper detected"); },
        () => { const chain = buildHashChain([event("a"), event("b")]); chain.events[1].previousHash = "bad"; assertCase(verifyHashChain(chain.events).tamperedEventIds.includes("b"), "link tamper detected"); },
        () => { const chain = buildHashChain([event("a")]); chain.events[0].hash = "bad"; assertCase(verifyHashChain(chain.events).tamperedEventIds.includes("a"), "hash tamper detected"); },
        () => { const chain = buildHashChain([event("a"), event("b")]); assertEqual(verifyHashChain(chain.events).tamperedEventIds.length, 0, "two-event clean"); },
        () => assertEqual(buildHashChain([event("a", 12)]).events[0].quantity, 12, "quantity retained"),
        () => assertEqual(buildHashChain([event("a")]).events[0].actor, "NZ Bee Co", "actor retained"),
        () => assertEqual(buildHashChain([event("a")]).events[0].action, "HARVEST", "action retained"),
        () => assertEqual(buildHashChain([event("a")]).batchId, "B1", "batch retained"),
        () => assertCase(buildHashChain([event("a"), event("b")]).headHash !== "GENESIS", "head hash"),
        () => assertCase(verifyHashChain(buildHashChain([event("a"), event("b")]).events).reason === undefined, "no failure reason"),
        () => assertCase(verifyHashChain([{ ...buildHashChain([event("a")]).events[0], eventId: "changed" }]).reason !== undefined, "failure reason"),
        () => assertEqual(runCustodySkill("B1", [{ ...event("a"), batchId: "B2" }]).tamperedEventIds[0], "a", "wrong batch id surfaced")
    ]);
}
