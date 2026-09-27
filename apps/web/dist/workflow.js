import { deterministicId } from "./crypto.js";
import { compareFingerprint } from "./skills/fingerprint-evidence/index.js";
import { buildHashChain } from "./skills/custody-ledger/index.js";
import { checkMpiMarketAccess } from "./skills/mpi-market-access/index.js";
import { runCustomsSkill } from "./skills/customs-clearance/index.js";
import { runAdversarySkill, injectFault, ALL_FAULTS } from "./skills/trade-risk-adversary/index.js";
import { auditTradeCase } from "./skills/evidence-monitor/index.js";
import { createTaskPlan, parseIntent } from "./skills/orchestration-hub/index.js";
import { SOURCE_REGISTRY } from "./rules.js";
import { runFrameworkRuntime } from "./framework-runtime.js";
import { calculateBusinessKpis } from "./kpis.js";
const REFERENCE_FINGERPRINT = { methylglyoxal: 0.62, dihydroxyacetone: 0.18, hydroxymethylfurfural: 0.31, sugarProfile: 0.44, pollenDNA: 0.28, moisture: 0.55, conductivity: 0.17, delta13C: 0.39 };
const SAMPLE_CSV = Object.entries(REFERENCE_FINGERPRINT).map(([name, value]) => `${name},${value}`).join("\n");
export function createDemoCase(intentText = "Release 1000 jars of UMF Mānuka honey from New Zealand to Australia for AU retail review") {
    const intent = parseIntent(intentText);
    const caseId = deterministicId("case", { intent, batchId: "MH-NZ-2026-0917" });
    const batchId = "MH-NZ-2026-0917";
    const lines = [{ sku: "MH-250-UMF15", description: "UMF Mānuka honey 250g", quantity: intent.quantity, unit: "jars", unitValueNzd: 12, netWeightKg: intent.quantity * 0.25 }];
    return {
        caseId,
        createdAt: "2026-09-17T20:00:00.000Z",
        intent,
        batchId,
        product: "UMF Mānuka honey",
        destination: intent.destination,
        quantity: intent.quantity,
        unit: intent.unit,
        referenceFingerprint: REFERENCE_FINGERPRINT,
        sampleCsv: SAMPLE_CSV,
        referenceBatchId: "REF-MH-AU-2026-08",
        custodyEvents: [
            { eventId: "farm-harvest", timestamp: "2026-09-01T08:00:00Z", actor: "Waikato Listed Apiary", location: "Waikato, NZ", action: "HARVEST", batchId, quantity: intent.quantity, metadata: { apiaryRegister: "NZ-APIARY-042" } },
            { eventId: "processor-pack", timestamp: "2026-09-03T10:00:00Z", actor: "Auckland Honey Processor", location: "Auckland, NZ", action: "PACK", batchId, quantity: intent.quantity, metadata: { rmp: "RMP-NZ-7788" } },
            { eventId: "warehouse-release", timestamp: "2026-09-07T12:00:00Z", actor: "NZ Export Warehouse", location: "Auckland, NZ", action: "RELEASE_TO_CARRIER", batchId, quantity: intent.quantity },
            { eventId: "carrier-booking", timestamp: "2026-09-09T09:00:00Z", actor: "Ocean Carrier", location: "Auckland Port, NZ", action: "BOOKED", batchId, quantity: intent.quantity }
        ],
        mpiEvidence: { listedBeekeeper: true, harvestDeclaration: true, rmp: true, omar: "AVAILABLE", exportCertificate: true, tradeCertification: true, declarationDate: "2026-09-05", evidenceFreshnessDays: 12, ruleVersion: "MPI-AU-2026.09" },
        customsInput: { caseId, seller: "Comvita Limited", sellerSourceUrl: SOURCE_REGISTRY.comvitaInvestor, buyer: "Australian natural-products importer (demo buyer)", origin: "New Zealand", destination: intent.destination, currency: "NZD", lines, freightNzd: 800, insuranceNzd: 100, dutyRate: 0, levyRate: 0.01, exportGstRate: 0, classificationEvidence: true },
        messages: []
    };
}
export async function runTradeCase(intentText, options = {}) {
    const tradeCase = createDemoCase(intentText);
    const plan = createTaskPlan(tradeCase.caseId, tradeCase.intent);
    if (process.env.BEETRUST_TRACE === "1") {
        const roots = plan.nodes.filter((node) => node.dependsOn.length === 0).map((node) => node.skill).join(", ");
        const sequence = plan.nodes.filter((node) => node.dependsOn.length > 0).map((node) => node.skill).join(" -> ");
        console.log(`[orchestration-hub] DAG_CREATED protocol=SkillMessage/v1 planId=${plan.planId} caseId=${plan.caseId} roots=[${roots}] sequence=${sequence}`);
    }
    const handlers = {
        "fingerprint-evidence": ({ tradeCase: current }) => { const result = compareFingerprint({ batchId: current.batchId, sampleCsv: current.sampleCsv, reference: current.referenceFingerprint, referenceBatchId: current.referenceBatchId }); current.fingerprint = result; return result; },
        "custody-ledger": ({ tradeCase: current }) => { const result = buildHashChain(current.custodyEvents); current.custody = result; return result; },
        "mpi-market-access": ({ tradeCase: current }) => { const result = checkMpiMarketAccess(current.destination, current.mpiEvidence); current.mpi = result; return result; },
        "customs-clearance": async ({ tradeCase: current }) => { const result = await runCustomsSkill({ ...current.customsInput, liveSourceLookup: options.liveSources }); current.customs = result; return result; },
        "trade-risk-adversary": ({ tradeCase: current }) => { const result = runAdversarySkill(current); current.adversary = result; return result; },
        "evidence-monitor": ({ tradeCase: current }) => { const result = auditTradeCase(current); current.monitor = result; return result; }
    };
    const runtime = await runFrameworkRuntime(plan, tradeCase, handlers, options.runtimeProvider ?? "langgraph-stategraph");
    tradeCase.messages.push(...runtime.messages);
    const baseline = tradeCase.monitor ?? auditTradeCase(tradeCase);
    const redTeam = [];
    if (options.includeRedTeam !== false) {
        for (const fault of ALL_FAULTS) {
            const mutated = injectFault(tradeCase, fault);
            await runStagesWithoutPlan(mutated, options, []);
            mutated.adversary = runAdversarySkill(tradeCase, [fault]);
            mutated.monitor = auditTradeCase(mutated);
            redTeam.push({ fault, decision: mutated.monitor?.decision ?? "BLOCKED", findings: mutated.adversary?.findings ?? [] });
        }
    }
    const kpis = calculateBusinessKpis(plan, baseline, redTeam, tradeCase.messages);
    return { tradeCase, plan, baseline, redTeam, frameworkRuntime: runtime.summary, kpis };
}
async function runStagesWithoutPlan(tradeCase, options, activeFaults) {
    tradeCase.fingerprint = compareFingerprint({ batchId: tradeCase.batchId, sampleCsv: tradeCase.sampleCsv, reference: tradeCase.referenceFingerprint, referenceBatchId: tradeCase.referenceBatchId });
    tradeCase.custody = buildHashChain(tradeCase.custodyEvents);
    tradeCase.mpi = checkMpiMarketAccess(tradeCase.destination, tradeCase.mpiEvidence);
    tradeCase.customs = await runCustomsSkill({ ...tradeCase.customsInput, liveSourceLookup: options.liveSources });
    tradeCase.adversary = runAdversarySkill(tradeCase, activeFaults);
    tradeCase.monitor = auditTradeCase(tradeCase);
}
