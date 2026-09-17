import type { SkillName } from "./types.js";
import { TRIGGER_WORDS as ORCHESTRATION_WORDS } from "./skills/orchestration-hub/index.js";
import { TRIGGER_WORDS as FINGERPRINT_WORDS } from "./skills/fingerprint-evidence/index.js";
import { TRIGGER_WORDS as CUSTODY_WORDS } from "./skills/custody-ledger/index.js";
import { TRIGGER_WORDS as MPI_WORDS } from "./skills/mpi-market-access/index.js";
import { TRIGGER_WORDS as CUSTOMS_WORDS } from "./skills/customs-clearance/index.js";
import { TRIGGER_WORDS as ADVERSARY_WORDS } from "./skills/trade-risk-adversary/index.js";
import { TRIGGER_WORDS as MONITOR_WORDS } from "./skills/evidence-monitor/index.js";

export const TRIGGER_REGISTRY: Record<SkillName, readonly string[]> = {
  "orchestration-hub": ORCHESTRATION_WORDS,
  "fingerprint-evidence": FINGERPRINT_WORDS,
  "custody-ledger": CUSTODY_WORDS,
  "mpi-market-access": MPI_WORDS,
  "customs-clearance": CUSTOMS_WORDS,
  "trade-risk-adversary": ADVERSARY_WORDS,
  "evidence-monitor": MONITOR_WORDS
};

export function routeTriggers(input: string): SkillName[] {
  const upper = input.toUpperCase();
  return (Object.entries(TRIGGER_REGISTRY) as Array<[SkillName, readonly string[]]>).filter(([, triggers]) => triggers.some((trigger) => upper.includes(trigger))).map(([skill]) => skill);
}
