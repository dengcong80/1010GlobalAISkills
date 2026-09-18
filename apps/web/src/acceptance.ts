import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { toAgentVerseTeamConfig, toAutoGenTeamConfig, validateFrameworkMessages } from "./framework-bridge.js";
import { compareFingerprint } from "./skills/fingerprint-evidence/index.js";
import { checkMpiMarketAccess } from "./skills/mpi-market-access/index.js";
import { runCustomsSkill } from "./skills/customs-clearance/index.js";
import { runAllSelfTests } from "./self-test.js";
import { routeTriggers, TRIGGER_REGISTRY } from "./trigger-registry.js";
import { runTradeCase } from "./workflow.js";
import type { MpiEvidence, SkillName } from "./types.js";

interface PackageSkill {
  name: SkillName;
  implementation: string;
  tests: string;
  contract: string;
  resources: string;
  scripts: string;
}

interface PackageManifest {
  packageVersion: string;
  track: string;
  subTrack: string;
  communicationSchema: string;
  mainPipeline: string[];
  evidenceSources?: string;
  validation: {
    minimumEffectiveSkills: number;
    minimumSelfTestsPerSkill: number;
    minimumTriggerHitRate: number;
    minimumMainPipelines: number;
  };
  skills: PackageSkill[];
}

export interface AcceptanceCheck {
  name: string;
  passed: boolean;
  details: string;
  value?: number | string | boolean;
}

export interface AcceptanceReport {
  packageVersion: string;
  track: string;
  subTrack: string;
  allPassed: boolean;
  checks: AcceptanceCheck[];
  evidence: {
    skillCount: number;
    selfTestCases: number;
    minimumSelfTestsPerSkill: number;
    triggerFixtureHitRate: number;
    triggerFixtureCases: number;
    triggerFixtureFalsePositives: number;
    naturalTriggerFixtureHitRate: number;
    naturalTriggerFixtureCases: number;
    naturalTriggerFixtureFalsePositives: number;
    mainPipelineRuns: number;
  };
}

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(appRoot, "track-b-package.json");

function addCheck(checks: AcceptanceCheck[], name: string, passed: boolean, details: string,
                 value?: number | string | boolean): void {
  checks.push({ name, passed, details, ...(value === undefined ? {} : { value }) });
}

function sameSkillSet(actual: SkillName[], expected: SkillName[]): boolean {
  return actual.length === expected.length && expected.every((skill) => actual.includes(skill));
}

function triggerFixtureMetrics(): {
  hitRate: number;
  cases: number;
  falsePositives: number;
} {
  const positiveCases = (Object.entries(TRIGGER_REGISTRY) as Array<[SkillName, readonly string[]]>).flatMap(
    ([skill, triggers]) => triggers.map((trigger) => ({
      input: `CASE COMMAND ${trigger}`,
      expected: [skill]
    }))
  );
  const passedCases = positiveCases.filter(({ input, expected }) => sameSkillSet(routeTriggers(input), expected));
  const negativeInputs = [
    "hello, explain this system",
    "show the general workspace overview",
    "what is the current case name?",
    "give me a short progress summary"
  ];
  const falsePositives = negativeInputs.filter((input) => routeTriggers(input).length > 0).length;
  return {
    hitRate: positiveCases.length === 0 ? 0 : passedCases.length / positiveCases.length,
    cases: positiveCases.length,
    falsePositives
  };
}

function naturalTriggerFixtureMetrics(): {
  hitRate: number;
  cases: number;
  falsePositives: number;
} {
  const cases: Array<{ input: string; expected: SkillName[] }> = [
    { input: "Please orchestrate this trade case and dispatch the work.", expected: ["orchestration-hub"] },
    { input: "Compare the LAB_CSV against the reference batch.", expected: ["fingerprint-evidence"] },
    { input: "Run a tamper check on the custody ledger.", expected: ["custody-ledger"] },
    { input: "Check MPI market access and OMAR evidence for Australia.", expected: ["mpi-market-access"] },
    { input: "Prepare the HS_CODE candidate and PACKING_LIST draft.", expected: ["customs-clearance"] },
    { input: "Run a RED_TEAM CHAOS rehearsal before release.", expected: ["trade-risk-adversary", "evidence-monitor"] },
    { input: "Audit the EVIDENCE_MATRIX before the final RELEASE decision.", expected: ["evidence-monitor"] },
    { input: "Retry the plan after the customs hand-off.", expected: ["orchestration-hub", "customs-clearance"] }
  ];
  const passedCases = cases.filter(({ input, expected }) => sameSkillSet(routeTriggers(input), expected));
  const negativeInputs = [
    "Can you explain the business case in plain English?",
    "Show me the dashboard without running a check.",
    "What is this prototype intended to demonstrate?"
  ];
  return {
    hitRate: cases.length === 0 ? 0 : passedCases.length / cases.length,
    cases: cases.length,
    falsePositives: negativeInputs.filter((input) => routeTriggers(input).length > 0).length
  };
}

function packageStructureChecks(manifest: PackageManifest, checks: AcceptanceCheck[]): void {
  const registrySkills = Object.keys(TRIGGER_REGISTRY) as SkillName[];
  const manifestSkills = manifest.skills.map((skill) => skill.name);
  addCheck(checks, "effective-skill-count",
    registrySkills.length >= manifest.validation.minimumEffectiveSkills,
    `${registrySkills.length} registered Skills; minimum is ${manifest.validation.minimumEffectiveSkills}`,
    registrySkills.length);
  addCheck(checks, "manifest-skill-registry",
    sameSkillSet(manifestSkills, registrySkills),
    `manifest and trigger registry contain the same ${registrySkills.length} Skills`);
  addCheck(checks, "shared-message-schema",
    manifest.communicationSchema === "SkillMessage/v1",
    `communication schema is ${manifest.communicationSchema}`);
  addCheck(checks, "main-pipeline-definition",
    manifest.mainPipeline.length >= manifest.validation.minimumMainPipelines,
    `manifest defines ${manifest.mainPipeline.length} main pipeline stages`, manifest.mainPipeline.length);

  for (const skill of manifest.skills) {
    const paths = [
      join(appRoot, skill.implementation),
      join(appRoot, skill.tests),
      join(appRoot, skill.contract),
      join(appRoot, skill.resources),
      join(appRoot, skill.scripts)
    ];
    const [implementation, tests, contract, resources, scripts] = paths;
    const resourceFiles = existsSync(resources) ? readdirSync(resources) : [];
    const scriptFiles = existsSync(scripts) ? readdirSync(scripts) : [];
    addCheck(checks, `${skill.name}-package-structure`,
      existsSync(implementation) && existsSync(tests) && existsSync(contract) &&
      existsSync(resources) && resourceFiles.length > 0 && existsSync(scripts) && scriptFiles.length > 0,
      `implementation=${existsSync(implementation)}, tests=${existsSync(tests)}, SKILL.md=${existsSync(contract)}, resources=${resourceFiles.length}, scripts=${scriptFiles.length}`);
  }
  if (manifest.evidenceSources) {
    const evidenceSourcesPath = join(appRoot, manifest.evidenceSources);
    addCheck(checks, "public-evidence-source-register", existsSync(evidenceSourcesPath),
      `evidence source register exists at ${manifest.evidenceSources}`);
  }
}

function frameworkBridgeCheck(workflow: Awaited<ReturnType<typeof runTradeCase>>, checks: AcceptanceCheck[]): void {
  const autoGen = toAutoGenTeamConfig(workflow.plan);
  const agentVerse = toAgentVerseTeamConfig(workflow.plan);
  const messageErrors = validateFrameworkMessages(workflow.tradeCase.messages);
  const passed = autoGen.teamType === "GraphFlow" &&
    autoGen.messageSchema === "SkillMessage/v1" &&
    autoGen.agents.length === workflow.plan.nodes.length + 1 &&
    agentVerse.planner === "orchestration-hub" &&
    agentVerse.observer === "evidence-monitor" &&
    agentVerse.workers.length === workflow.plan.nodes.length &&
    messageErrors.length === 0;
  addCheck(checks, "framework-bridge-contract", passed,
    `GraphFlow agents=${autoGen.agents.length}, AgentVerse workers=${agentVerse.workers.length}, message errors=${messageErrors.length}. Descriptors are generated locally; live framework runtime remains NOT VERIFIED.`);
}

async function invalidInputFallbackCheck(workflow: Awaited<ReturnType<typeof runTradeCase>>, checks: AcceptanceCheck[]): Promise<void> {
  const malformedFingerprint = compareFingerprint({
    batchId: "acceptance-invalid-fingerprint",
    sampleCsv: "not a laboratory payload",
    reference: { methylglyoxal: 0.62 },
    referenceBatchId: "acceptance-reference"
  });
  const invalidMpiEvidence: MpiEvidence = {
    listedBeekeeper: false,
    harvestDeclaration: false,
    rmp: false,
    omar: "MISSING",
    exportCertificate: false,
    tradeCertification: false,
    declarationDate: "not-a-date",
    evidenceFreshnessDays: -1,
    ruleVersion: "stale-rule"
  };
  const invalidMpi = checkMpiMarketAccess("Unknown market", invalidMpiEvidence);
  const invalidCustoms = await runCustomsSkill({
    ...workflow.tradeCase.customsInput,
    buyer: "",
    classificationEvidence: false,
    lines: [{ ...workflow.tradeCase.customsInput.lines[0], quantity: 0, netWeightKg: 0 }]
  });
  const passed = malformedFingerprint.status === "BLOCKED" && invalidMpi.status === "BLOCKED" && invalidCustoms.status === "BLOCKED" && invalidCustoms.validationIssues.length >= 2;
  addCheck(checks, "invalid-input-fallbacks", passed,
    `malformed fingerprint=${malformedFingerprint.status}, unknown market=${invalidMpi.status}, invalid customs=${invalidCustoms.status}; fail-closed branches=${passed ? 3 : 0}/3`);
}

export async function runAcceptance(): Promise<AcceptanceReport> {
  const checks: AcceptanceCheck[] = [];
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as PackageManifest;
  packageStructureChecks(manifest, checks);

  const summaries = await runAllSelfTests();
  const totalCases = summaries.reduce((sum, summary) => sum + summary.passed, 0);
  const minimumSelfTests = Math.min(...summaries.map((summary) => summary.passed));
  const allSelfTestsPassed = summaries.every((summary) => summary.failed === 0);
  addCheck(checks, "self-test-coverage",
    allSelfTestsPassed && minimumSelfTests >= manifest.validation.minimumSelfTestsPerSkill,
    `${totalCases} cases passed; minimum per Skill is ${manifest.validation.minimumSelfTestsPerSkill}`,
    totalCases);

  const triggerMetrics = triggerFixtureMetrics();
  addCheck(checks, "trigger-fixture-hit-rate",
    triggerMetrics.hitRate >= manifest.validation.minimumTriggerHitRate && triggerMetrics.falsePositives === 0,
    `${(triggerMetrics.hitRate * 100).toFixed(1)}% over ${triggerMetrics.cases} registered-trigger fixtures; ${triggerMetrics.falsePositives} negative false positives`,
    triggerMetrics.hitRate);
  const naturalTriggerMetrics = naturalTriggerFixtureMetrics();
  addCheck(checks, "natural-trigger-fixtures",
    naturalTriggerMetrics.hitRate >= manifest.validation.minimumTriggerHitRate && naturalTriggerMetrics.falsePositives === 0,
    `${(naturalTriggerMetrics.hitRate * 100).toFixed(1)}% over ${naturalTriggerMetrics.cases} authored user-like fixtures; ${naturalTriggerMetrics.falsePositives} negative false positives`,
    naturalTriggerMetrics.hitRate);

  const workflow = await runTradeCase(undefined, { liveSources: false, includeRedTeam: true });
  const registeredSkills = Object.keys(TRIGGER_REGISTRY) as SkillName[];
  const observedSkills = [...new Set(workflow.tradeCase.messages.map((message) => message.skill))];
  const mainPipelinePassed = workflow.plan.nodes.length >= manifest.validation.minimumEffectiveSkills &&
    observedSkills.length >= manifest.validation.minimumEffectiveSkills &&
    observedSkills.every((skill) => registeredSkills.includes(skill)) &&
    workflow.baseline.decision === "RELEASE" &&
    workflow.redTeam.length >= 6 &&
    workflow.redTeam.every((scenario) => scenario.decision === "BLOCKED");
  addCheck(checks, "main-pipeline-e2e",
    mainPipelinePassed,
    `plan nodes=${workflow.plan.nodes.length}, observed Skills=${observedSkills.length}, baseline=${workflow.baseline.decision}, red-team=${workflow.redTeam.length}`,
    workflow.redTeam.length);
  frameworkBridgeCheck(workflow, checks);
  await invalidInputFallbackCheck(workflow, checks);

  const allPassed = checks.every((check) => check.passed);
  return {
    packageVersion: manifest.packageVersion,
    track: manifest.track,
    subTrack: manifest.subTrack,
    allPassed,
    checks,
    evidence: {
      skillCount: registeredSkills.length,
      selfTestCases: totalCases,
      minimumSelfTestsPerSkill: minimumSelfTests,
      triggerFixtureHitRate: triggerMetrics.hitRate,
      triggerFixtureCases: triggerMetrics.cases,
      triggerFixtureFalsePositives: triggerMetrics.falsePositives,
      naturalTriggerFixtureHitRate: naturalTriggerMetrics.hitRate,
      naturalTriggerFixtureCases: naturalTriggerMetrics.cases,
      naturalTriggerFixtureFalsePositives: naturalTriggerMetrics.falsePositives,
      mainPipelineRuns: mainPipelinePassed ? 1 : 0
    }
  };
}
