import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import type { SkillMessage, FrameworkRuntimeSummary, SkillName, StageStatus, TaskPlan, TradeCase } from "./types.js";
import { createMessage, type TaskHandler } from "./skills/orchestration-hub/index.js";

export interface FrameworkRuntimeResult {
  outputs: Partial<Record<SkillName, unknown>>;
  messages: SkillMessage[];
  summary: FrameworkRuntimeSummary;
}

interface GraphState {
  tradeCase: TradeCase;
  outputs: Partial<Record<SkillName, unknown>>;
}

/**
 * Run the collaboration plan through LangGraph's open-source StateGraph.
 *
 * Nodes are real Skill handlers, dependency edges are compiled by the
 * framework, and each node appends the shared SkillMessage/v1 lifecycle events.
 * The graph has no model or network dependency, so it stays reproducible in a
 * judging environment while remaining portable to an AutoGen or AgentVerse
 * transport through the existing framework bridge.
 */
export async function runFrameworkRuntime(
  plan: TaskPlan,
  tradeCase: TradeCase,
  handlers: Partial<Record<SkillName, TaskHandler>>,
  provider: FrameworkRuntimeSummary["provider"] = "langgraph-stategraph"
): Promise<FrameworkRuntimeResult> {
  const messages: SkillMessage[] = [];
  const State = Annotation.Root({
    tradeCase: Annotation<TradeCase>(),
    outputs: Annotation<Partial<Record<SkillName, unknown>>>({
      reducer: (left, right) => ({ ...left, ...right }),
      default: () => ({})
    })
  });
  const builder: any = new StateGraph(State);
  for (const node of plan.nodes) {
    builder.addNode(node.id, async (state: GraphState) => {
      const handler = handlers[node.skill];
      if (!handler) throw new Error(`No handler registered for ${node.skill}`);
      let output: unknown;
      let succeeded = false;
      for (let attempt = 1; attempt <= node.maxAttempts && !succeeded; attempt += 1) {
        const startedMessage = createMessage(plan.caseId, node.id, node.skill, "TASK_STARTED", "RUNNING", { nodeId: node.id }, attempt);
        messages.push(startedMessage);
        emitRuntimeProtocol(startedMessage, startedMessage.payload);
        try {
          output = await handler({ tradeCase: state.tradeCase, plan, outputs: state.outputs, attempt });
          const completedMessage = createMessage(plan.caseId, node.id, node.skill, "TASK_COMPLETED", "PASS", output, attempt, extractEvidenceRefs(output));
          messages.push(completedMessage);
          emitRuntimeProtocol(completedMessage, summarizeAgentOutput(node.skill, output));
          emitAgentKeyLog(node.skill, output);
          succeeded = true;
        } catch (error) {
          const type = attempt < node.maxAttempts ? "TASK_RETRY" : "TASK_FAILED";
          const errorMessage = createMessage(plan.caseId, node.id, node.skill, type, "ERROR", { error: error instanceof Error ? error.message : String(error) }, attempt);
          messages.push(errorMessage);
          emitRuntimeProtocol(errorMessage, errorMessage.payload);
          if (attempt === node.maxAttempts) throw error;
        }
      }
      return { outputs: { [node.skill]: output } };
    });
  }
  for (const node of plan.nodes) {
    if (node.dependsOn.length === 0) builder.addEdge(START, node.id);
    else if (node.dependsOn.length === 1) builder.addEdge(node.dependsOn[0], node.id);
    else builder.addEdge(node.dependsOn, node.id);
  }
  for (const node of plan.nodes) {
    if (!plan.nodes.some((candidate) => candidate.dependsOn.includes(node.id))) builder.addEdge(node.id, END);
  }
  const graph = builder.compile({ name: "beetrust-cross-border-release-graph", description: "Mānuka honey export evidence collaboration graph" });
  const result = await graph.invoke({ tradeCase, outputs: {} });
  const orderedMessages = [...messages].sort((left, right) => {
    const leftIndex = plan.nodes.findIndex((node) => node.skill === left.skill);
    const rightIndex = plan.nodes.findIndex((node) => node.skill === right.skill);
    return leftIndex - rightIndex || left.timestamp.localeCompare(right.timestamp) || left.attempt - right.attempt;
  });
  const agentRuns = plan.nodes.map((node) => {
    const nodeMessages = orderedMessages.filter((message) => message.skill === node.skill);
    const completed = nodeMessages.find((message) => message.type === "TASK_COMPLETED");
    const output = (result.outputs as Partial<Record<SkillName, unknown>>)[node.skill];
    const outputStatus = output && typeof output === "object" && "status" in output ? (output as { status?: unknown }).status : undefined;
    return {
      skill: node.skill,
      attempts: Math.max(1, ...nodeMessages.map((message) => message.attempt)),
      status: (outputStatus === "BLOCKED" || outputStatus === "REVIEW" || outputStatus === "PASS" ? outputStatus : completed?.status === "PASS" ? "PASS" : "REVIEW") as StageStatus
    };
  });
  return {
    outputs: result.outputs as Partial<Record<SkillName, unknown>>,
    messages: orderedMessages,
    summary: {
      provider,
      runtimeVersion: "langgraph/1.4.16-beetrust-adapter/1.0",
      executed: true,
      agentRuns,
      monitoring: {
        messagesObserved: orderedMessages.length,
        dependencyEdges: plan.nodes.reduce((sum, node) => sum + node.dependsOn.length, 0),
        retries: orderedMessages.filter((message) => message.type === "TASK_RETRY").length
      }
    }
  };
}

function extractEvidenceRefs(output: unknown): string[] {
  if (!output || typeof output !== "object") return [];
  const refs = (output as { evidenceRefs?: unknown }).evidenceRefs;
  return Array.isArray(refs) ? refs.filter((value): value is string => typeof value === "string") : [];
}

function emitRuntimeProtocol(message: SkillMessage, payload: unknown): void {
  if (process.env.BEETRUST_TRACE !== "1") return;
  console.log(`[SkillMessage/v1] ${JSON.stringify({ sender: message.sender, receiver: message.receiver, protocol: message.protocol, taskState: message.taskState, id: message.id, caseId: message.caseId, correlationId: message.correlationId, skill: message.skill, type: message.type, timestamp: message.timestamp, attempt: message.attempt, status: message.status, evidenceRefs: message.evidenceRefs, payload })}`);
}

function emitAgentKeyLog(skill: SkillName, output: unknown): void {
  if (process.env.BEETRUST_TRACE !== "1") return;
  console.log(`[agent:${skill}] ${JSON.stringify(summarizeAgentOutput(skill, output))}`);
  if (skill !== "custody-ledger" || !isRecord(output)) return;
  const events = Array.isArray(output.events) ? output.events : [];
  for (const event of events) {
    if (!isRecord(event)) continue;
    console.log(`[SHA-256][custody-ledger] eventId=${String(event.eventId)} previousHash=${String(event.previousHash)} hash=${String(event.hash)}`);
  }
  console.log(`[SHA-256][custody-ledger] headHash=${String(output.headHash)} verification=${String(output.status)} tamperedEventIds=${JSON.stringify(output.tamperedEventIds ?? [])}`);
}

function summarizeAgentOutput(skill: SkillName, output: unknown): Record<string, unknown> {
  if (!isRecord(output)) return { value: output };
  if (skill === "fingerprint-evidence") return { status: output.status, batchId: output.batchId, referenceBatchId: output.referenceBatchId, similarity: output.similarity, confidence: output.confidence, anomalies: output.anomalies, anomaliesDetected: output.anomaliesDetected ?? (Array.isArray(output.anomalies) && output.anomalies.length > 0), evidenceRefs: output.evidenceRefs };
  if (skill === "custody-ledger") return { status: output.status, batchId: output.batchId, eventsChecked: Array.isArray(output.events) ? output.events.length : 0, headHash: output.headHash, tamperedEventIds: output.tamperedEventIds, evidenceRefs: output.evidenceRefs };
  if (skill === "mpi-market-access") {
    const checks = Array.isArray(output.checks) ? output.checks.filter(isRecord) : [];
    return { status: output.status, destination: output.destination, ruleVersion: output.ruleVersion, checksPassed: checks.filter((check) => check.passed === true).length, checksTotal: checks.length, missingEvidence: output.missingEvidence, evidenceRefs: output.evidenceRefs };
  }
  if (skill === "customs-clearance") {
    const hsCandidates = Array.isArray(output.hsCandidates) ? output.hsCandidates : [];
    const documents = Array.isArray(output.documents) ? output.documents : [];
    const totals = isRecord(output.totals) ? output.totals : {};
    return { status: output.status, hsCandidates, estimatedLandedValueNzd: totals.estimatedLandedValueNzd, documents: documents.map((document) => isRecord(document) ? document.documentType : document), validationIssues: output.validationIssues, evidenceRefs: output.evidenceRefs };
  }
  if (skill === "trade-risk-adversary") return { status: output.status, activeFaults: output.activeFaults, findings: Array.isArray(output.findings) ? output.findings : [], evidenceRefs: output.evidenceRefs };
  if (skill === "evidence-monitor") {
    const gates = Array.isArray(output.gates) ? output.gates.filter(isRecord).map((gate) => ({ gate: gate.gate, status: gate.status, evidenceRefs: gate.evidenceRefs })) : [];
    return { decision: output.decision, score: output.score, gates, missingEvidence: output.missingEvidence, nextActions: output.nextActions };
  }
  return output;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}
