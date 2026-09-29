import { createHash } from "node:crypto";

const events = [
  { eventId: "harvest", timestamp: "2026-09-01T08:00:00Z", actor: "Listed apiary", location: "Waikato, NZ", action: "HARVEST", batchId: "example-batch", quantity: 1000 },
  { eventId: "pack", timestamp: "2026-09-03T10:00:00Z", actor: "Processor", location: "Auckland, NZ", action: "PACK", batchId: "example-batch", quantity: 1000 }
];

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

let previousHash = "GENESIS";
const chainedEvents = events.map((event) => {
  const linkedEvent = { ...event, previousHash };
  const hash = sha256(JSON.stringify(linkedEvent));
  previousHash = hash;
  return { ...linkedEvent, hash };
});

console.log(JSON.stringify({
  skill: "custody-ledger",
  result: {
    status: "PASS",
    batchId: "example-batch",
    events: chainedEvents,
    headHash: previousHash,
    tamperedEventIds: [],
    evidenceRefs: ["custody-evidence-example"]
  }
}, null, 2));
