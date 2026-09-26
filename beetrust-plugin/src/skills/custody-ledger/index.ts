import { sha256, deterministicId } from "../../crypto.js";
import type { CustodyEvent, CustodyEventInput, CustodyResult } from "../../types.js";

export const TRIGGER_WORDS = ["CUSTODY", "LEDGER", "CHAIN_OF_CUSTODY", "TAMPER_CHECK"] as const;

const GENESIS = "GENESIS";

export function buildHashChain(events: CustodyEventInput[]): CustodyResult {
  let previousHash = GENESIS;
  const chained: CustodyEvent[] = events.map((event) => {
    const hash = hashEvent(event, previousHash);
    const chainedEvent: CustodyEvent = { ...event, previousHash, hash };
    previousHash = hash;
    return chainedEvent;
  });
  const verification = verifyHashChain(chained);
  return {
    status: verification.valid ? "PASS" : "BLOCKED",
    batchId: events[0]?.batchId ?? "",
    events: chained,
    headHash: previousHash,
    tamperedEventIds: verification.tamperedEventIds,
    evidenceRefs: [deterministicId("custody-evidence", chained.map((event) => event.hash))]
  };
}

export function verifyHashChain(events: CustodyEvent[]): { valid: boolean; tamperedEventIds: string[]; reason?: string } {
  let previousHash = GENESIS;
  const tamperedEventIds: string[] = [];
  for (const event of events) {
    const expected = hashEvent(event, previousHash);
    if (event.previousHash !== previousHash || event.hash !== expected) tamperedEventIds.push(event.eventId);
    previousHash = event.hash;
  }
  return { valid: tamperedEventIds.length === 0, tamperedEventIds, reason: tamperedEventIds.length ? "Hash link or event payload does not match." : undefined };
}

function hashEvent(event: CustodyEventInput, previousHash: string): string {
  return sha256({ eventId: event.eventId, timestamp: event.timestamp, actor: event.actor, location: event.location, action: event.action, batchId: event.batchId, quantity: event.quantity, metadata: event.metadata, previousHash });
}

export function runCustodySkill(batchId: string, events: CustodyEventInput[]): CustodyResult {
  if (!batchId || events.length === 0) return { status: "BLOCKED", batchId, events: [], headHash: GENESIS, tamperedEventIds: [], evidenceRefs: [] };
  const wrongBatch = events.some((event) => event.batchId !== batchId);
  if (wrongBatch) return { status: "BLOCKED", batchId, events: [], headHash: GENESIS, tamperedEventIds: events.filter((event) => event.batchId !== batchId).map((event) => event.eventId), evidenceRefs: [] };
  return buildHashChain(events);
}
