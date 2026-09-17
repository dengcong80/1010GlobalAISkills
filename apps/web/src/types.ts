export type SkillName =
  | "orchestration-hub"
  | "fingerprint-evidence"
  | "custody-ledger"
  | "mpi-market-access"
  | "customs-clearance"
  | "trade-risk-adversary"
  | "evidence-monitor";

export type StageStatus = "PASS" | "REVIEW" | "BLOCKED";
export type ReleaseDecision = "RELEASE" | "REVIEW" | "BLOCKED";
export type FaultType =
  | "fingerprint-mismatch"
  | "batch-id-tamper"
  | "missing-document"
  | "quantity-mismatch"
  | "destination-change"
  | "rule-version-conflict";

export interface TradeIntent {
  raw: string;
  product: string;
  destination: string;
  origin: string;
  quantity: number;
  unit: string;
  priority: "normal" | "urgent";
  requestedBy: string;
}

export interface TaskNode {
  id: string;
  skill: SkillName;
  purpose: string;
  dependsOn: string[];
  maxAttempts: number;
}

export interface TaskPlan {
  planId: string;
  caseId: string;
  intent: TradeIntent;
  nodes: TaskNode[];
  communicationSchema: string;
  horizon: string[];
}

export interface SkillMessage<T = unknown> {
  id: string;
  caseId: string;
  correlationId: string;
  skill: SkillName;
  type: "TASK_CREATED" | "TASK_STARTED" | "TASK_COMPLETED" | "TASK_RETRY" | "TASK_FAILED" | "EVIDENCE_APPENDED";
  timestamp: string;
  attempt: number;
  status: StageStatus | "PENDING" | "RUNNING" | "ERROR";
  payload: T;
  evidenceRefs: string[];
}

export interface FingerprintFeature {
  name: string;
  value: number;
  unit: string;
  tolerance: number;
}

export interface FingerprintInput {
  batchId: string;
  sampleCsv: string;
  reference: Record<string, number>;
  referenceBatchId: string;
}

export interface FingerprintResult {
  status: StageStatus;
  batchId: string;
  referenceBatchId: string;
  features: FingerprintFeature[];
  similarity: number;
  confidence: number;
  anomalies: string[];
  evidenceRefs: string[];
  disclaimer: string;
}

export interface CustodyEventInput {
  eventId: string;
  timestamp: string;
  actor: string;
  location: string;
  action: string;
  batchId: string;
  quantity: number;
  metadata?: Record<string, string>;
}

export interface CustodyEvent extends CustodyEventInput {
  previousHash: string;
  hash: string;
}

export interface CustodyResult {
  status: StageStatus;
  batchId: string;
  events: CustodyEvent[];
  headHash: string;
  tamperedEventIds: string[];
  evidenceRefs: string[];
}

export interface MpiEvidence {
  listedBeekeeper: boolean;
  harvestDeclaration: boolean;
  rmp: boolean;
  omar: "AVAILABLE" | "NOT_REQUIRED" | "MISSING" | "EXPIRED";
  exportCertificate: boolean;
  tradeCertification: boolean;
  declarationDate: string;
  evidenceFreshnessDays: number;
  ruleVersion?: string;
}

export interface MpiCheck {
  id: string;
  label: string;
  required: boolean;
  passed: boolean;
  status: StageStatus;
  reason: string;
  evidenceRef: string;
}

export interface MpiResult {
  status: StageStatus;
  destination: string;
  ruleVersion: string;
  checks: MpiCheck[];
  missingEvidence: string[];
  evidenceRefs: string[];
  sourceUrls: string[];
  disclaimer: string;
}

export interface CustomsLine {
  sku: string;
  description: string;
  quantity: number;
  unit: string;
  unitValueNzd: number;
  netWeightKg: number;
}

export interface CustomsInput {
  caseId: string;
  seller: string;
  buyer: string;
  origin: string;
  destination: string;
  currency: "NZD";
  lines: CustomsLine[];
  freightNzd: number;
  insuranceNzd: number;
  dutyRate: number;
  levyRate: number;
  exportGstRate: number;
  classificationEvidence: boolean;
  sellerSourceUrl?: string;
  liveSourceLookup?: boolean;
}

export interface CustomsDocument {
  documentType: "COMMERCIAL_INVOICE" | "PACKING_LIST" | "TSW_DRAFT";
  documentNumber: string;
  content: Record<string, unknown>;
  evidenceRef: string;
}

export interface CustomsResult {
  status: StageStatus;
  hsCandidates: Array<{ code: string; description: string; confidence: number }>;
  totals: {
    goodsValueNzd: number;
    freightNzd: number;
    insuranceNzd: number;
    dutyNzd: number;
    levyNzd: number;
    exportGstNzd: number;
    estimatedLandedValueNzd: number;
  };
  documents: CustomsDocument[];
  validationIssues: string[];
  evidenceRefs: string[];
  sourceUrls: string[];
  assumptions: string[];
}

export interface AdversaryFinding {
  fault: FaultType;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  observed: string;
  expectedGate: StageStatus;
}

export interface AdversaryResult {
  status: StageStatus;
  activeFaults: FaultType[];
  findings: AdversaryFinding[];
  mutatedCase?: TradeCase;
  evidenceRefs: string[];
}

export interface MonitorGate {
  gate: string;
  status: StageStatus;
  evidenceRefs: string[];
  reason: string;
}

export interface MonitorResult {
  decision: ReleaseDecision;
  score: number;
  gates: MonitorGate[];
  missingEvidence: string[];
  nextActions: string[];
  evidenceMatrix: Record<string, string[]>;
}

export interface TradeCase {
  caseId: string;
  createdAt: string;
  intent: TradeIntent;
  batchId: string;
  product: string;
  destination: string;
  quantity: number;
  unit: string;
  referenceFingerprint: Record<string, number>;
  sampleCsv: string;
  referenceBatchId: string;
  custodyEvents: CustodyEventInput[];
  mpiEvidence: MpiEvidence;
  customsInput: CustomsInput;
  fingerprint?: FingerprintResult;
  custody?: CustodyResult;
  mpi?: MpiResult;
  customs?: CustomsResult;
  adversary?: AdversaryResult;
  monitor?: MonitorResult;
  messages: SkillMessage[];
}

export interface WorkflowOptions {
  liveSources?: boolean;
  includeRedTeam?: boolean;
}

export interface WorkflowRun {
  tradeCase: TradeCase;
  plan: TaskPlan;
  baseline: MonitorResult;
  redTeam: Array<{ fault: FaultType; decision: ReleaseDecision; findings: AdversaryFinding[] }>;
}

export interface SwarmObservation {
  rootAgents: string[];
  parallelRootCount: number;
  collaborationEdges: number;
  criticalPathLength: number;
  messageCounts: Record<string, number>;
}
