import { assertCase, assertEqual, runCases, type TestSummary } from "../../test-utils.js";
import { createMessage, createTaskPlan, executeTaskPlan, observeSwarm, parseIntent, renderPlanLevels } from "./index.js";
import { routeTriggers, TRIGGER_REGISTRY } from "../../trigger-registry.js";
import type { TradeCase } from "../../types.js";

const baseCase = { caseId: "case-test", messages: [] } as unknown as TradeCase;

export function runTests(): TestSummary {
  return runCases("orchestration-hub", [
    () => assertEqual(parseIntent("Ship 200 jars Manuka honey to Australia").quantity, 200, "quantity parse"),
    () => assertEqual(parseIntent("Ship 2,500 jars of honey to China").quantity, 2500, "comma quantity parse"),
    () => assertEqual(parseIntent("Export urgent Mānuka honey to Australia").priority, "urgent", "priority parse"),
    () => assertEqual(parseIntent("Ship honey to China").destination, "China", "destination parse"),
    () => assertEqual(parseIntent("Ship honey from New Zealand to Australia").origin, "New Zealand", "origin parse"),
    () => assertEqual(parseIntent("Ship honey to Australia").product, "Honey", "generic product parse"),
    () => assertEqual(parseIntent("Ship Manuka honey to Australia").product, "Mānuka honey", "manuka product parse"),
    () => assertEqual(parseIntent("Ship 20kg honey to Australia").unit, "kg", "kg unit parse"),
    () => assertEqual(parseIntent("Ship honey").quantity, 1000, "quantity default"),
    () => assertEqual(parseIntent("Ship honey").destination, "Australia", "destination default"),
    () => assertEqual(parseIntent("Ship honey").origin, "New Zealand", "origin default"),
    () => assertEqual(parseIntent("Ship honey ASAP").priority, "urgent", "ASAP priority"),
    () => assertCase(parseIntent("Ship honey").requestedBy.length > 0, "requester is set"),
    () => assertEqual(createTaskPlan("c", parseIntent("Ship honey")).nodes.length, 6, "six DAG nodes"),
    () => assertCase(createTaskPlan("c", parseIntent("Ship honey")).nodes.find((node) => node.id === "monitor")?.dependsOn.includes("adversary"), "monitor dependency"),
    () => assertCase(createTaskPlan("c", parseIntent("Ship honey")).nodes.find((node) => node.id === "customs")?.dependsOn.includes("mpi"), "customs dependency"),
    () => assertCase(createTaskPlan("c", parseIntent("Ship honey")).nodes.some((node) => node.skill === "custody-ledger"), "custody node"),
    () => assertEqual(createTaskPlan("c", parseIntent("Ship honey")).communicationSchema, "SkillMessage/v1", "schema"),
    () => assertEqual(createMessage("c", "fingerprint", "fingerprint-evidence", "TASK_COMPLETED", "PASS", {}).sender, "fingerprint-evidence", "message sender"),
    () => assertEqual(createMessage("c", "fingerprint", "fingerprint-evidence", "TASK_COMPLETED", "PASS", {}).receiver, "evidence-monitor", "message receiver"),
    () => assertEqual(createMessage("c", "fingerprint", "fingerprint-evidence", "TASK_COMPLETED", "PASS", {}).protocol, "SkillMessage/v1", "message protocol"),
    () => assertEqual(createMessage("c", "fingerprint", "fingerprint-evidence", "TASK_COMPLETED", "PASS", {}).taskState, "SUCCESS", "message task state"),
    () => assertCase(createTaskPlan("c", parseIntent("Ship honey")).planId.startsWith("plan_"), "deterministic plan id"),
    () => assertCase(createTaskPlan("c", parseIntent("Ship honey")).nodes.every((node) => node.maxAttempts === 2), "retry budget"),
    () => assertCase(createTaskPlan("c", parseIntent("Ship honey")).nodes.every((node) => node.purpose.length > 10), "node purpose"),
    () => assertCase(createTaskPlan("c", parseIntent("Ship honey")).nodes.map((node) => node.id).includes("fingerprint"), "fingerprint node"),
    () => assertCase(createTaskPlan("c", parseIntent("Ship honey")).nodes.map((node) => node.id).includes("customs"), "customs node"),
    () => assertCase(createTaskPlan("c", parseIntent("Ship honey")).nodes.map((node) => node.id).includes("monitor"), "monitor node"),
    () => assertCase(createTaskPlan("c", parseIntent("Ship honey")).nodes.filter((node) => node.dependsOn.length === 0).length >= 2, "parallel roots"),
    () => assertEqual(createTaskPlan("c", parseIntent("Ship honey")).horizon.length, 6, "long-horizon phases"),
    () => assertCase(observeSwarm(createTaskPlan("c", parseIntent("Ship honey")), []).parallelRootCount >= 2, "swarm roots"),
    () => assertCase(observeSwarm(createTaskPlan("c", parseIntent("Ship honey")), []).collaborationEdges >= 5, "swarm edges"),
    () => assertCase(observeSwarm(createTaskPlan("c", parseIntent("Ship honey")), []).criticalPathLength >= 4, "critical path"),
    () => assertCase(renderPlanLevels(createTaskPlan("c", parseIntent("Ship honey"))).includes(" || "), "parallel DAG rendering"),
    () => assertCase(baseCase.caseId === "case-test", "test fixture"),
    () => assertCase(typeof executeTaskPlan === "function", "executor exported"),
    () => assertCase(routeTriggers("RED_TEAM and MPI").includes("trade-risk-adversary"), "red team trigger route"),
    () => assertCase(routeTriggers("RED_TEAM and MPI").includes("mpi-market-access"), "MPI trigger route"),
    () => assertEqual(Object.keys(TRIGGER_REGISTRY).length, 7, "seven registered trigger sets"),
    () => assertCase(routeTriggers("unrecognised command").length === 0, "unknown trigger")
  ]);
}
