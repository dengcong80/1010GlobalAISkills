import type { SkillMessage, TaskPlan } from "./types.js";

export interface FrameworkAgentDescriptor {
  name: string;
  role: string;
  handoffs: string[];
  maxAttempts: number;
}

export interface AutoGenTeamConfig {
  framework: "autogen-compatible";
  teamType: "GraphFlow";
  agents: FrameworkAgentDescriptor[];
  messageSchema: string;
}

export interface AgentVerseTeamConfig {
  framework: "agentverse-compatible";
  planner: string;
  workers: FrameworkAgentDescriptor[];
  observer: string;
  messageSchema: string;
}

export function toAutoGenTeamConfig(plan: TaskPlan): AutoGenTeamConfig {
  return { framework: "autogen-compatible", teamType: "GraphFlow", agents: [plannerDescriptor(plan), ...descriptors(plan)], messageSchema: plan.communicationSchema };
}

export function toAgentVerseTeamConfig(plan: TaskPlan): AgentVerseTeamConfig {
  return { framework: "agentverse-compatible", planner: "orchestration-hub", workers: descriptors(plan).filter((agent) => agent.name !== "orchestration-hub"), observer: "evidence-monitor", messageSchema: plan.communicationSchema };
}

export function validateFrameworkMessages(messages: SkillMessage[]): string[] {
  return messages.flatMap((message) => [
    ...(message.caseId ? [] : ["message.caseId is required"]),
    ...(message.correlationId ? [] : ["message.correlationId is required"]),
    ...(message.evidenceRefs.every((ref) => typeof ref === "string") ? [] : ["message.evidenceRefs must contain strings"])
  ]);
}

function descriptors(plan: TaskPlan): FrameworkAgentDescriptor[] {
  return plan.nodes.map((node) => ({ name: node.skill, role: node.purpose, handoffs: plan.nodes.filter((candidate) => candidate.dependsOn.includes(node.id)).map((candidate) => candidate.skill), maxAttempts: node.maxAttempts }));
}

function plannerDescriptor(plan: TaskPlan): FrameworkAgentDescriptor {
  return { name: "orchestration-hub", role: "Trade Incident Commander: decompose, dispatch and retry the export case.", handoffs: plan.nodes.filter((node) => node.dependsOn.length === 0).map((node) => node.skill), maxAttempts: 2 };
}
