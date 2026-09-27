import { deterministicId } from "../../crypto.js";
export const TRIGGER_WORDS = ["ORCHESTRATE", "TRADE_CASE", "PLAN", "DISPATCH", "RETRY"];
export const SKILL_MESSAGE_PROTOCOL = "SkillMessage/v1";
export function parseIntent(raw) {
    const quantityMatch = raw.match(/(\d[\d,]*)\s*(?:jars?|units?|boxes?|kg|kilograms?)/i);
    const destinationMatch = raw.match(/\bto\s+([A-Za-z][A-Za-z ]+?)(?:\s+(?:for|via|under|with)\b|[,.]|$)/i);
    const originMatch = raw.match(/\bfrom\s+([A-Za-z][A-Za-z ]+?)(?:\s+to\b|[,.]|$)/i);
    const priority = /urgent|asap|critical/i.test(raw) ? "urgent" : "normal";
    const product = /m[aā]nuka/i.test(raw) ? "Mānuka honey" : /honey/i.test(raw) ? "Honey" : "NZ bee product";
    return {
        raw,
        product,
        destination: destinationMatch?.[1]?.trim() ?? "Australia",
        origin: originMatch?.[1]?.trim() ?? "New Zealand",
        quantity: quantityMatch ? Number(quantityMatch[1].replaceAll(",", "")) : 1000,
        unit: quantityMatch?.[0].toLowerCase().includes("kg") ? "kg" : "jars",
        priority,
        requestedBy: "trade-incident-commander"
    };
}
export function createTaskPlan(caseId, intent) {
    const nodes = [
        { id: "fingerprint", skill: "fingerprint-evidence", purpose: "Validate scientific batch evidence against a reference profile.", dependsOn: [], maxAttempts: 2 },
        { id: "custody", skill: "custody-ledger", purpose: "Build and verify a tamper-evident custody chain.", dependsOn: [], maxAttempts: 2 },
        { id: "mpi", skill: "mpi-market-access", purpose: "Evaluate destination-specific MPI evidence and rule version.", dependsOn: [], maxAttempts: 2 },
        { id: "customs", skill: "customs-clearance", purpose: "Prepare classification candidates, landed-cost estimate and export documents.", dependsOn: ["mpi"], maxAttempts: 2 },
        { id: "adversary", skill: "trade-risk-adversary", purpose: "Run fault injection against the assembled case.", dependsOn: ["fingerprint", "custody", "mpi", "customs"], maxAttempts: 2 },
        { id: "monitor", skill: "evidence-monitor", purpose: "Aggregate evidence and apply release gates.", dependsOn: ["fingerprint", "custody", "mpi", "customs", "adversary"], maxAttempts: 2 }
    ];
    return { planId: deterministicId("plan", { caseId, intent }), caseId, intent, nodes, communicationSchema: "SkillMessage/v1", horizon: ["intake", "evidence", "market-access", "customs", "adversarial-stress", "release-audit"] };
}
export function createMessage(caseId, correlationId, skill, type, status, payload, attempt = 1, evidenceRefs = [], receiver = defaultReceiverFor(skill)) {
    return {
        sender: skill,
        receiver,
        protocol: SKILL_MESSAGE_PROTOCOL,
        taskState: taskStateFor(type),
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
export function defaultReceiverFor(skill) {
    return skill === "evidence-monitor" ? "orchestration-hub" : "evidence-monitor";
}
export function taskStateFor(type) {
    if (type === "TASK_CREATED")
        return "PENDING";
    if (type === "TASK_STARTED")
        return "RUNNING";
    if (type === "TASK_RETRY")
        return "RETRY";
    if (type === "TASK_FAILED")
        return "FAILED";
    if (type === "EVIDENCE_APPENDED")
        return "SUCCESS";
    return "SUCCESS";
}
export async function executeTaskPlan(plan, tradeCase, handlers) {
    const outputs = {};
    const messages = [];
    const completed = new Set();
    const pending = new Set(plan.nodes.map((node) => node.id));
    while (pending.size > 0) {
        const runnable = plan.nodes.filter((node) => pending.has(node.id) && node.dependsOn.every((dependency) => completed.has(dependency)));
        if (runnable.length === 0)
            throw new Error("Task plan has an unresolved dependency cycle.");
        // Nodes at the same DAG level are independent agents. Run that level
        // concurrently, then commit outputs in plan order so the demo timeline
        // remains deterministic and downstream nodes see a complete level.
        const results = await Promise.all(runnable.map(async (node) => {
            const handler = handlers[node.skill];
            if (!handler)
                throw new Error(`No handler registered for ${node.skill}`);
            const taskMessages = [];
            let output;
            let completedTask = false;
            for (let attempt = 1; attempt <= node.maxAttempts && !completedTask; attempt += 1) {
                taskMessages.push(createMessage(plan.caseId, node.id, node.skill, "TASK_STARTED", "RUNNING", { nodeId: node.id }, attempt));
                try {
                    output = await handler({ tradeCase, plan, outputs, attempt });
                    taskMessages.push(createMessage(plan.caseId, node.id, node.skill, "TASK_COMPLETED", "PASS", output, attempt, extractEvidenceRefs(output)));
                    completedTask = true;
                }
                catch (error) {
                    const status = attempt < node.maxAttempts ? "TASK_RETRY" : "TASK_FAILED";
                    taskMessages.push(createMessage(plan.caseId, node.id, node.skill, status, "ERROR", { error: error instanceof Error ? error.message : String(error) }, attempt));
                    if (attempt === node.maxAttempts)
                        throw error;
                }
            }
            return { node, output, taskMessages };
        }));
        for (const result of results) {
            outputs[result.node.skill] = result.output;
            messages.push(...result.taskMessages);
            pending.delete(result.node.id);
            completed.add(result.node.id);
        }
    }
    return { outputs, messages };
}
export function renderRuntimeTimeline(messages) {
    return messages.map((message) => `${message.timestamp} | ${message.type.padEnd(16)} | ${message.skill.padEnd(24)} | attempt ${message.attempt} | ${message.status}`).join("\n");
}
export function renderPlanLevels(plan) {
    const completed = new Set();
    const remaining = new Set(plan.nodes.map((node) => node.id));
    const levels = [];
    while (remaining.size > 0) {
        const level = plan.nodes.filter((node) => remaining.has(node.id) && node.dependsOn.every((dependency) => completed.has(dependency)));
        if (level.length === 0)
            return "[dependency-cycle]";
        levels.push(`[${level.map((node) => node.skill).join(" || ")}]`);
        level.forEach((node) => { remaining.delete(node.id); completed.add(node.id); });
    }
    return levels.join(" -> ");
}
export function observeSwarm(plan, messages) {
    const roots = plan.nodes.filter((node) => node.dependsOn.length === 0).map((node) => node.skill);
    const messageCounts = {};
    for (const message of messages)
        messageCounts[message.skill] = (messageCounts[message.skill] ?? 0) + 1;
    const longest = (nodeId, seen = new Set()) => {
        if (seen.has(nodeId))
            return 0;
        seen.add(nodeId);
        const node = plan.nodes.find((candidate) => candidate.id === nodeId);
        if (!node || node.dependsOn.length === 0)
            return 1;
        return 1 + Math.max(...node.dependsOn.map((dependency) => longest(dependency, new Set(seen))));
    };
    return { rootAgents: roots, parallelRootCount: roots.length, collaborationEdges: plan.nodes.reduce((sum, node) => sum + node.dependsOn.length, 0), criticalPathLength: Math.max(...plan.nodes.map((node) => longest(node.id))), messageCounts };
}
function extractEvidenceRefs(output) {
    if (!output || typeof output !== "object")
        return [];
    const refs = output.evidenceRefs;
    return Array.isArray(refs) ? refs.filter((value) => typeof value === "string") : [];
}
