export function toAutoGenTeamConfig(plan) {
    return { framework: "autogen-compatible", teamType: "GraphFlow", agents: [plannerDescriptor(plan), ...descriptors(plan)], messageSchema: plan.communicationSchema };
}
export function toAgentVerseTeamConfig(plan) {
    return { framework: "agentverse-compatible", planner: "orchestration-hub", workers: descriptors(plan).filter((agent) => agent.name !== "orchestration-hub"), observer: "evidence-monitor", messageSchema: plan.communicationSchema };
}
export function validateFrameworkMessages(messages) {
    return messages.flatMap((message) => [
        ...(message.sender ? [] : ["message.sender is required"]),
        ...(message.receiver ? [] : ["message.receiver is required"]),
        ...(message.protocol === "SkillMessage/v1" ? [] : ["message.protocol must be SkillMessage/v1"]),
        ...(message.taskState ? [] : ["message.taskState is required"]),
        ...(message.caseId ? [] : ["message.caseId is required"]),
        ...(message.correlationId ? [] : ["message.correlationId is required"]),
        ...(message.evidenceRefs.every((ref) => typeof ref === "string") ? [] : ["message.evidenceRefs must contain strings"])
    ]);
}
function descriptors(plan) {
    return plan.nodes.map((node) => ({ name: node.skill, role: node.purpose, handoffs: plan.nodes.filter((candidate) => candidate.dependsOn.includes(node.id)).map((candidate) => candidate.skill), maxAttempts: node.maxAttempts }));
}
function plannerDescriptor(plan) {
    return { name: "orchestration-hub", role: "Trade Incident Commander: decompose, dispatch and retry the export case.", handoffs: plan.nodes.filter((node) => node.dependsOn.length === 0).map((node) => node.skill), maxAttempts: 2 };
}
