import { createDemoCase } from "../../../dist/workflow.js";
import { ALL_FAULTS, runAdversarySkill } from "../../../dist/skills/trade-risk-adversary/index.js";

const tradeCase = createDemoCase();
const fault = ALL_FAULTS[0];
console.log(JSON.stringify({ skill: "trade-risk-adversary", fault, result: runAdversarySkill(tradeCase, [fault]) }, null, 2));
