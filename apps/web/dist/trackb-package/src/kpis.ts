import { observeSwarm } from "./skills/orchestration-hub/index.js";
import type { BusinessKpis, MonitorResult, TaskPlan, SkillMessage } from "./types.js";

export function calculateBusinessKpis(
  plan: TaskPlan,
  baseline: MonitorResult,
  redTeam: Array<{ decision: string }>,
  messages: SkillMessage[]
): BusinessKpis {
  const swarm = observeSwarm(plan, messages);
  const evidenceBearingGates = baseline.gates.filter((gate) => gate.evidenceRefs.length > 0).length;
  const evidenceCoveragePct = baseline.gates.length === 0 ? 0 : Math.round((evidenceBearingGates / baseline.gates.length) * 100);
  const blockedFaults = redTeam.filter((scenario) => scenario.decision === "BLOCKED").length;
  const faultDetectionPct = redTeam.length === 0 ? 0 : Math.round((blockedFaults / redTeam.length) * 100);
  // These are transparent pilot estimates based on the six hand-offs in this
  // deterministic fixture. Replace them with measured operator telemetry later.
  const estimatedManualMinutes = plan.nodes.length * 18;
  const estimatedOrchestratedMinutes = Math.max(8, plan.nodes.length * 4 + swarm.criticalPathLength * 2);
  const estimatedTimeReductionPct = Math.round((1 - estimatedOrchestratedMinutes / estimatedManualMinutes) * 100);
  return {
    evidenceCoveragePct,
    faultDetectionPct,
    parallelRootAgents: swarm.parallelRootCount,
    criticalPathStages: swarm.criticalPathLength,
    totalMessages: messages.length,
    estimatedManualMinutes,
    estimatedOrchestratedMinutes,
    estimatedTimeReductionPct,
    status: "TARGET_FOR_PILOT"
  };
}
