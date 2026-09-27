import { createTaskPlan, parseIntent } from "../../../dist/skills/orchestration-hub/index.js";

const raw = process.argv.slice(2).join(" ") || "Orchestrate 1000 jars of Mānuka honey from New Zealand to Australia";
const intent = parseIntent(raw);
console.log(JSON.stringify({ skill: "orchestration-hub", intent, taskPlan: createTaskPlan("example-case", intent) }, null, 2));
