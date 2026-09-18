import { buildHashChain } from "../../../dist/skills/custody-ledger/index.js";

const events = [
  { eventId: "harvest", timestamp: "2026-09-01T08:00:00Z", actor: "Listed apiary", location: "Waikato, NZ", action: "HARVEST", batchId: "example-batch", quantity: 1000 },
  { eventId: "pack", timestamp: "2026-09-03T10:00:00Z", actor: "Processor", location: "Auckland, NZ", action: "PACK", batchId: "example-batch", quantity: 1000 }
];
console.log(JSON.stringify({ skill: "custody-ledger", result: buildHashChain(events) }, null, 2));
