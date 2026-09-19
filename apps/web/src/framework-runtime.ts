import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { deterministicId } from "./crypto.js";
import type { SkillMessage, FrameworkRuntimeSummary, SkillName, StageStatus, TaskPlan, TradeCase } from "./types.js";
import type { TaskHandler } from "./skills/orchestration-hub/index.js";

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
        messages.push(createRuntimeMessage(plan.caseId, node.id, node.skill, "TASK_STARTED", "RUNNING", { nodeId: node.id }, attempt));
        try {
          output = await handler({ tradeCase: state.tradeCase, plan, outputs: state.outputs, attempt });
          messages.push(createRuntimeMessage(plan.caseId, node.id, node.skill, "TASK_COMPLETED", "PASS", output, attempt, extractEvidenceRefs(output)));
          succeeded = true;
        } catch (error) {
          const type = attempt < node.maxAttempts ? "TASK_RETRY" : "TASK_FAILED";
          messages.push(createRuntimeMessage(plan.caseId, node.id, node.skill, type, "ERROR", { error: error instanceof Error ? error.message : String(error) }, attempt));
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

function createRuntimeMessage<T>(caseId: string, correlationId: string, skill: SkillName, type: SkillMessage<T>["type"], status: SkillMessage<T>["status"], payload: T, attempt: number, evidenceRefs: string[] = []): SkillMessage<T> {
  return {
    id: deterministicId("msg", { caseId, correlationId, skill, type, attempt, payload }),
    caseId,
    correlationId,
    skill,
    type,
    timestamp: new Date().toISOString(),
    attempt,
    status,
    payload,
    evidenceRefs
  };
}

function extractEvidenceRefs(output: unknown): string[] {
  if (!output || typeof output !== "object") return [];
  const refs = (output as { evidenceRefs?: unknown }).evidenceRefs;
  return Array.isArray(refs) ? refs.filter((value): value is string => typeof value === "string") : [];
}
