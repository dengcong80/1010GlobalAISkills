import { runTradeCase } from "../../../dist/workflow.js";

const workflow = await runTradeCase(undefined, { liveSources: false, includeRedTeam: true });
console.log(JSON.stringify({ skill: "evidence-monitor", baseline: workflow.baseline, redTeamDecisions: workflow.redTeam.map(({ fault, decision }) => ({ fault, decision })) }, null, 2));
