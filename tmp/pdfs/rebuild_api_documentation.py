from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf" / "API Documentation Revised.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

pdfmetrics.registerFont(TTFont("BeeSans", r"C:\Windows\Fonts\DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("BeeSans-Bold", r"C:\Windows\Fonts\DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("BeeMono", r"C:\Windows\Fonts\DejaVuSansMono.ttf"))

NAVY = colors.HexColor("#17324D")
TEAL = colors.HexColor("#0B7A75")
GOLD = colors.HexColor("#D49A2A")
PALE = colors.HexColor("#F2F6F8")
PALE_TEAL = colors.HexColor("#E7F3F1")
INK = colors.HexColor("#1D2935")
MUTED = colors.HexColor("#5B6B78")
GRID = colors.HexColor("#C9D5DB")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleBee", fontName="BeeSans-Bold", fontSize=24, leading=29, textColor=NAVY, spaceAfter=8))
styles.add(ParagraphStyle(name="SubtitleBee", fontName="BeeSans", fontSize=10.8, leading=15, textColor=MUTED, spaceAfter=15))
styles.add(ParagraphStyle(name="H1Bee", fontName="BeeSans-Bold", fontSize=16, leading=20, textColor=NAVY, spaceBefore=10, spaceAfter=7))
styles.add(ParagraphStyle(name="H2Bee", fontName="BeeSans-Bold", fontSize=11.3, leading=15, textColor=TEAL, spaceBefore=7, spaceAfter=4))
styles.add(ParagraphStyle(name="BodyBee", fontName="BeeSans", fontSize=8.65, leading=12.2, textColor=INK, spaceAfter=5))
styles.add(ParagraphStyle(name="SmallBee", fontName="BeeSans", fontSize=7.2, leading=9.4, textColor=INK, spaceAfter=3))
styles.add(ParagraphStyle(name="SmallMuted", fontName="BeeSans", fontSize=7.15, leading=9.4, textColor=MUTED, spaceAfter=3))
styles.add(ParagraphStyle(name="TableHead", fontName="BeeSans-Bold", fontSize=7.15, leading=8.8, textColor=colors.white))
styles.add(ParagraphStyle(name="TableCell", fontName="BeeSans", fontSize=6.85, leading=8.7, textColor=INK))
styles.add(ParagraphStyle(name="TableCellBold", fontName="BeeSans-Bold", fontSize=6.85, leading=8.7, textColor=NAVY))
styles.add(ParagraphStyle(name="CodeBee", fontName="BeeMono", fontSize=6.55, leading=8.4, textColor=INK, backColor=PALE, borderColor=GRID, borderWidth=0.5, borderPadding=6, spaceBefore=3, spaceAfter=6))
styles.add(ParagraphStyle(name="Callout", fontName="BeeSans-Bold", fontSize=8.75, leading=12.4, textColor=NAVY, backColor=PALE_TEAL, borderColor=TEAL, borderWidth=0.8, borderPadding=8, spaceBefore=5, spaceAfter=8))


def p(text, style="BodyBee"):
    return Paragraph(text, styles[style])


def code(text):
    return Paragraph(escape(text).replace("\n", "<br/>"), styles["CodeBee"])


def bullet(text):
    return p(f"<font color='{TEAL}'>-</font> {text}")


def cell(text, bold=False):
    return p(escape(text).replace("\n", "<br/>"), "TableCellBold" if bold else "TableCell")


def head(*items):
    return [p(item, "TableHead") for item in items]


def table(rows, widths):
    result = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
    commands = [
        ("GRID", (0, 0), (-1, -1), 0.45, GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ]
    for row in range(1, len(rows)):
        commands.append(("BACKGROUND", (0, row), (-1, row), colors.white if row % 2 else PALE))
    result.setStyle(TableStyle(commands))
    return result


def footer(canvas, doc):
    canvas.saveState()
    width, _ = letter
    canvas.setStrokeColor(GRID)
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, 0.48 * inch, width - doc.rightMargin, 0.48 * inch)
    canvas.setFont("BeeSans", 7.2)
    canvas.setFillColor(MUTED)
    canvas.drawString(doc.leftMargin, 0.29 * inch, "BeeTrust Honey Export Release Desk | Track B Commerce | API documentation")
    canvas.drawRightString(width - doc.rightMargin, 0.29 * inch, f"Page {doc.page}")
    canvas.restoreState()


def api_page(story, number, name, title, necessity, signature, params, input_sample, output_sample, behavior, usage, limits):
    story.append(PageBreak())
    story.append(p(f"{number}. {name}: {title}", "H1Bee"))
    story.append(p(f"<b>Necessity.</b> {necessity}"))
    story.append(p("<b>Primary call.</b>", "H2Bee"))
    story.append(code(signature))
    story.append(p("Parameters", "H2Bee"))
    story.append(table([head("Name", "Type", "Req.", "Meaning")] + [[cell(a, True), cell(b), cell(c), cell(d)] for a, b, c, d in params], [1.15 * inch, 1.55 * inch, 0.62 * inch, 3.55 * inch]))
    story.append(p("Input example", "H2Bee"))
    story.append(code(input_sample))
    story.append(p("Output example", "H2Bee"))
    story.append(code(output_sample))
    story.append(p("Detailed behavior", "H2Bee"))
    for item in behavior:
        story.append(bullet(item))
    story.append(p(f"<b>Usage guidance.</b> {usage}"))
    if limits:
        story.append(p(f"<b>Limits and failure handling.</b> {limits}"))


story = [
    Spacer(1, 0.18 * inch),
    p("BEETRUST / TRACK B COMMERCE", "H2Bee"),
    p("API Documentation", "TitleBee"),
    p("Skill API calls, contracts, examples, necessity, and integration guidance", "SubtitleBee"),
    HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=14),
    p("Purpose and scope", "H1Bee"),
    p("This document is the developer reference for the BeeTrust TypeScript API. It explains what each public Skill call does, why the call is needed in the release workflow, the exact input and output shape, normal and exception behavior, and the recommended way to compose the calls. The public surface is re-exported from apps/web/src/public-api.ts and compiled into apps/web/dist by npm run build."),
    p("The package is a local, deterministic prototype. It has no REST server in the repository; consumers import the functions from the compiled TypeScript/JavaScript package or call the supplied command-line demos. The only optional network operation is the live NZ Customs tariff lookup. No call submits a TSW declaration or issues an MPI, laboratory, or Customs certificate.", "Callout"),
    p("Supported judged case", "H1Bee"),
    code("Release 1000 jars of UMF Mānuka honey from New Zealand to Australia for AU retail review."),
    p("The default case is intentionally constrained so that the API contract, fixture evidence, and acceptance tests remain repeatable. A production integration should replace the synthetic fixture with authorised case data and current broker, MPI, tariff, and laboratory evidence."),
    p("Status model", "H1Bee"),
    table([
        head("Value", "Meaning", "Consumer action"),
        [cell("PASS", True), cell("The Skill completed its gate without a blocking issue."), cell("Continue to the next dependency, while retaining evidenceRefs.")],
        [cell("REVIEW", True), cell("The Skill found an unresolved but potentially recoverable issue."), cell("Pause automatic release and request broker, operator, or source verification.")],
        [cell("BLOCKED", True), cell("Required input, evidence, integrity, or fault control failed."), cell("Do not release; resolve the listed reason and run the affected gate again.")],
        [cell("RELEASE", True), cell("The final evidence-monitor decision when all five release gates pass."), cell("Release only to broker review with the evidence bundle; human authority remains explicit.")],
    ], [1.0 * inch, 3.0 * inch, 2.87 * inch]),
    p("Quick start", "H1Bee"),
    code("import { runTradeCase } from \"./dist/public-api.js\";\n\nconst result = await runTradeCase(undefined, {\n  liveSources: false,\n  includeRedTeam: true,\n  runtimeProvider: \"langgraph-stategraph\"\n});\n\nconsole.log(result.baseline.decision, result.baseline.score);\nconsole.log(result.tradeCase.monitor?.nextActions);"),
    p("Expected baseline: RELEASE 100/100 for the supported fixture. The returned object also contains the TaskPlan, five-gate baseline, six red-team decisions, runtime summary, SkillMessage/v1 messages, and pilot-labelled KPI proxies."),
]

story += [
    PageBreak(),
    p("Public API map and shared contract", "H1Bee"),
    p("Every call below is exported from apps/web/src/public-api.ts unless explicitly marked as a type or an internal helper. The API is deliberately function-based so a dashboard, command-line runner, test, or future transport can use the same contract."),
    table([
        head("API group", "Public calls", "Why the group exists"),
        [cell("Case and workflow", True), cell("createDemoCase, runTradeCase, parseIntent, createTaskPlan, executeTaskPlan, observeSwarm, renderPlanLevels, renderRuntimeTimeline"), cell("Creates one case, plans dependencies, executes work, and makes concurrency and lifecycle trace visible.")],
        [cell("Scientific evidence", True), cell("extractFeatures, compareFingerprint"), cell("Normalizes laboratory extracts and turns comparison into a repeatable evidence gate.")],
        [cell("Custody integrity", True), cell("buildHashChain, verifyHashChain, runCustodySkill"), cell("Makes payload and batch-identity changes observable through linked hashes.")],
        [cell("Market access", True), cell("checkMpiMarketAccess"), cell("Checks destination-specific MPI evidence and freshness before Customs preparation.")],
        [cell("Customs preparation", True), cell("fetchOfficialTariffSource, hsCandidatesFor, runCustomsSkill"), cell("Separates classification candidates, transparent cost estimates, source checks, and drafts.")],
        [cell("Adversarial testing", True), cell("ALL_FAULTS, injectFault, evaluateFault, runAdversarySkill"), cell("Proves that controlled changes are detected without mutating the baseline case.")],
        [cell("Release monitoring", True), cell("auditTradeCase, renderAuditSummary"), cell("Aggregates five gates and applies BLOCKED > REVIEW > RELEASE precedence.")],
        [cell("Integration and validation", True), cell("routeTriggers, runFrameworkRuntime, toAutoGenTeamConfig, toAgentVerseTeamConfig, validateFrameworkMessages, runAcceptance, runAllSelfTests, calculateBusinessKpis"), cell("Connects trigger routing, framework-compatible execution, protocol validation, and verification reporting.")],
    ], [1.28 * inch, 3.05 * inch, 2.54 * inch]),
    p("Shared input and output conventions", "H2Bee"),
    table([
        head("Convention", "Contract"),
        [cell("Case identity", True), cell("caseId identifies the trade case; batchId identifies the physical batch; correlationId links a task's lifecycle messages.")],
        [cell("Evidence", True), cell("Successful gates expose evidenceRefs. The final evidenceMatrix retains those references by gate; an empty evidenceRefs list is treated as missing evidence.")],
        [cell("Errors", True), cell("Domain problems are normally represented by REVIEW or BLOCKED results. Orchestration handler failures may emit TASK_RETRY and TASK_FAILED lifecycle messages or reject the Promise after the retry budget.")],
        [cell("Determinism", True), cell("Normal demos use deterministic fixtures and source snapshots. liveSourceLookup=true performs a real HTTP check and therefore requires network availability.")],
        [cell("Mutability", True), cell("Workflow handlers populate the TradeCase outputs. injectFault deep-clones before mutation; direct hash and evidence calls return new result objects.")],
    ], [1.45 * inch, 5.42 * inch]),
    p("Shared result shape", "H2Bee"),
    code("type StageStatus = \"PASS\" | \"REVIEW\" | \"BLOCKED\";\ntype ReleaseDecision = \"RELEASE\" | \"REVIEW\" | \"BLOCKED\";\n\ninterface GateEvidence {\n  status: StageStatus;\n  evidenceRefs: string[];\n  reason: string;\n}"),
    p("Read every result status and evidenceRefs before using the output. A non-empty result object is not evidence of a successful gate."),
]

api_page(
    story, "1", "orchestration-hub", "case creation, intent parsing, planning, and execution",
    "The seven Skills need one case identity, dependency-aware order, retries, concurrency, and a structured lifecycle trace before a release recommendation can be made.",
    "createDemoCase(intentText?: string): TradeCase\nparseIntent(raw: string): TradeIntent\ncreateTaskPlan(caseId: string, intent: TradeIntent): TaskPlan\nrunTradeCase(intentText?: string, options?: WorkflowOptions): Promise<WorkflowRun>",
    [
        ("intentText", "string", "No", "Trade sentence. If omitted, the supported New Zealand-to-Australia 1000-jar fixture is used."),
        ("options.liveSources", "boolean", "No", "When true, Customs attempts the live public tariff lookup. Default is false."),
        ("options.includeRedTeam", "boolean", "No", "When false, skip the six fault replays. Default is true."),
        ("options.runtimeProvider", "RuntimeProvider", "No", "langgraph-stategraph or local-agentverse-swarm. Default is langgraph-stategraph."),
        ("caseId", "string", "Yes", "Stable case identifier used by createTaskPlan."),
        ("intent", "TradeIntent", "Yes", "Parsed product, origin, destination, quantity, unit, priority, and requester."),
    ],
    "const intent = parseIntent(\n  \"Release 1000 jars of UMF Mānuka honey from New Zealand to Australia for AU retail review\"\n);\nconst plan = createTaskPlan(\"case-demo-001\", intent);\nconst run = await runTradeCase(undefined, { includeRedTeam: true });",
    "{\n  plan: { communicationSchema: \"SkillMessage/v1\", nodes: 6 },\n  baseline: { decision: \"RELEASE\", score: 100 },\n  redTeam: [ { fault: \"batch-id-tamper\", decision: \"BLOCKED\" } ],\n  kpis: { evidenceCoveragePct: 100, faultDetectionPct: 100,\n    parallelRootAgents: 3, criticalPathStages: 4, totalMessages: 12,\n    status: \"TARGET_FOR_PILOT\" }\n}",
    [
        "parseIntent extracts the trade fields and uses the supported defaults when fields are absent.",
        "createTaskPlan creates six nodes: three roots, Customs after MPI, adversary after operational outputs, and monitor last.",
        "runTradeCase executes the StateGraph adapter, retains ordered messages, runs red-team replays, and calculates KPI proxies.",
        "executeTaskPlan runs same-level nodes concurrently, commits in plan order, retries up to maxAttempts, and observeSwarm exposes the runtime shape.",
    ],
    "Use runTradeCase for the complete workflow; use lower-level calls for custom runners and tests. Preserve the returned plan and messages with the case.",
    "The parser is constrained to the demo contract. A missing handler, dependency cycle, or exhausted retry budget is an execution error, not a release result.",
)

api_page(
    story, "2", "fingerprint-evidence", "laboratory extract parsing and batch comparison",
    "This API is necessary because a release cannot treat a laboratory file as a reliable match without normalizing marker names, checking completeness, calculating similarity, and identifying anomalies. It provides a deterministic triage result that can be included in the evidence matrix.",
    "extractFeatures(sampleCsv: string): Record<string, number>\ncompareFingerprint(input: FingerprintInput): FingerprintResult",
    [
        ("sampleCsv", "string", "Yes", "CSV-like marker rows. Comma, semicolon, tab, and colon separators are accepted."),
        ("batchId", "string", "Yes", "Batch being evaluated."),
        ("reference", "Record<string, number>", "Yes", "Reference marker values keyed by normalized feature name."),
        ("referenceBatchId", "string", "Yes", "Identity of the reference profile."),
    ],
    "const input = {\n  batchId: \"MH-NZ-2026-0917\",\n  sampleCsv: \"methylglyoxal,0.62\\nmoisture,0.55\\npollenDNA,0.28\",\n  reference: { methylglyoxal: 0.62, moisture: 0.55, pollenDNA: 0.28 },\n  referenceBatchId: \"REF-MH-AU-2026-08\"\n};\nconst result = compareFingerprint(input);",
    "{\n  status: \"PASS\", batchId: \"MH-NZ-2026-0917\",\n  referenceBatchId: \"REF-MH-AU-2026-08\", similarity: 1, confidence: 1,\n  anomalies: [], anomaliesDetected: false,\n  features: [{ name: \"methylglyoxal\", value: 0.62, unit: \"mg/kg\", tolerance: 0.05 }],\n  evidenceRefs: [\"lab-evidence_...\"],\n  disclaimer: \"Prototype similarity scoring supports triage...\"\n}",
    [
        "extractFeatures skips blank lines, comments, and a feature header, then normalizes aliases such as MG, DHA, HMF, sugar profile, pollen DNA, moisture, conductivity, and delta13C.",
        "compareFingerprint calculates per-feature tolerance, relative distance, completeness, similarity, and confidence.",
        "PASS requires no anomalies and at least 90% completeness. REVIEW is used when similarity is at least 0.85 and completeness is at least 0.75 but PASS conditions are not met. Otherwise the result is BLOCKED.",
        "The returned features include unit and tolerance so a reviewer can understand the comparison rather than receiving only a score.",
    ],
    "Call extractFeatures when a consumer needs the normalized marker map alone. Call compareFingerprint when the result must become a release gate and carry an evidence reference.",
    "Malformed or incomplete data is not silently accepted. The similarity score is prototype triage support; it is not a laboratory certificate, UMF licence, or MPI assurance.",
)

api_page(
    story, "3", "custody-ledger", "tamper-evident chain construction and verification",
    "This API is necessary because a batch travels through multiple actors and locations. A plain event list does not make payload edits or batch-identity changes obvious. The hash chain creates a reproducible integrity check that can be retained with the release case.",
    "buildHashChain(events: CustodyEventInput[]): CustodyResult\nverifyHashChain(events: CustodyEvent[]): { valid: boolean; tamperedEventIds: string[]; reason?: string }\nrunCustodySkill(batchId: string, events: CustodyEventInput[]): CustodyResult",
    [
        ("events", "CustodyEventInput[]", "Yes", "Ordered events with eventId, timestamp, actor, location, action, batchId, quantity, and optional metadata."),
        ("batchId", "string", "Yes for runCustodySkill", "Expected physical batch identity. Every event must match it."),
        ("previousHash", "string", "Yes for verifyHashChain", "Hash link stored on an already chained event."),
        ("hash", "string", "Yes for verifyHashChain", "Hash of the canonical event payload and previous link."),
    ],
    "const events = [\n  { eventId: \"farm-harvest\", timestamp: \"2026-09-01T08:00:00Z\",\n    actor: \"Waikato Listed Apiary\", location: \"Waikato, NZ\",\n    action: \"HARVEST\", batchId: \"MH-NZ-2026-0917\", quantity: 1000 }\n];\nconst result = runCustodySkill(\"MH-NZ-2026-0917\", events);",
    "{\n  status: \"PASS\", batchId: \"MH-NZ-2026-0917\",\n  events: [{ eventId: \"farm-harvest\", previousHash: \"GENESIS\", hash: \"...64 hex chars...\" }],\n  headHash: \"...64 hex chars...\", tamperedEventIds: [],\n  evidenceRefs: [\"custody-evidence_...\"]\n}",
    [
        "buildHashChain starts at GENESIS and adds previousHash and hash to each event in order.",
        "verifyHashChain recomputes the payload hash and link for every event and identifies tamperedEventIds.",
        "runCustodySkill validates that the list is non-empty and every event uses the expected batchId before building the chain.",
        "A broken link, edited payload, invalid batch identity, or empty list returns BLOCKED through the skill boundary.",
    ],
    "Use runCustodySkill in a release workflow. Use buildHashChain when constructing a new ledger and verifyHashChain when independently checking a stored ledger or a received event list.",
    "The chain is an evidence-integrity layer, not a public blockchain, ownership registry, or legal title record. Store the full events and headHash together; a headHash without the events is not enough for independent verification.",
)

api_page(
    story, "4", "mpi-market-access", "destination-specific evidence and rule checks",
    "This API is necessary because market-access requirements vary by destination and evidence freshness. It provides check-level results for beekeeper status, harvest declaration, RMP, OMAR, export certificate, trade certification, freshness, and rule-version alignment before Customs documents are prepared.",
    "checkMpiMarketAccess(destination: string, evidence: MpiEvidence): MpiResult",
    [
        ("destination", "string", "Yes", "Destination name or supported alias such as Australia or AU."),
        ("listedBeekeeper", "boolean", "Yes", "Whether listed beekeeper evidence is available."),
        ("harvestDeclaration", "boolean", "Yes", "Whether harvest declaration evidence is available."),
        ("rmp", "boolean", "Yes", "Whether the risk management programme evidence is available."),
        ("omar", "OMAR state", "Yes", "AVAILABLE, NOT_REQUIRED, MISSING, or EXPIRED."),
        ("exportCertificate", "boolean", "Yes", "Whether export certificate evidence is available."),
        ("tradeCertification", "boolean", "Yes", "Whether trade certification evidence is available."),
        ("declarationDate", "string", "Yes", "ISO-like declaration date retained with the case."),
        ("evidenceFreshnessDays", "number", "Yes", "Prototype freshness age; valid range is 0 through 365."),
        ("ruleVersion", "string", "No", "Case rule version. A mismatch with the current snapshot is BLOCKED."),
    ],
    "const result = checkMpiMarketAccess(\"Australia\", {\n  listedBeekeeper: true, harvestDeclaration: true, rmp: true,\n  omar: \"AVAILABLE\", exportCertificate: true, tradeCertification: true,\n  declarationDate: \"2026-09-05\", evidenceFreshnessDays: 12,\n  ruleVersion: \"MPI-AU-2026.09\"\n});",
    "{\n  status: \"PASS\", destination: \"Australia\", ruleVersion: \"MPI-AU-2026.09\",\n  checks: [{ id: \"omar\", status: \"PASS\", passed: true, evidenceRef: \"mpi-evidence_...\" }],\n  missingEvidence: [], evidenceRefs: [\"mpi-evidence_...\"],\n  sourceUrls: [\"https://www.mpi.govt.nz/...\"],\n  disclaimer: \"Rule snapshot is a decision-support prototype...\"\n}",
    [
        "The destination is resolved to a versioned rule snapshot. The supported demo uses MPI-AU-2026.09.",
        "Each required check returns passed, status, reason, and evidenceRef so the operator can identify the exact missing item.",
        "Unknown destinations, missing required evidence, expired OMAR, stale or negative freshness, and rule-version mismatch fail closed to BLOCKED.",
        "A non-required check can produce REVIEW without being silently converted to PASS.",
    ],
    "Call this API before runCustomsSkill in a dependency-aware workflow. Persist ruleVersion, sourceUrls, checks, and evidenceRefs with the case so a later reviewer sees which snapshot was used.",
    "The snapshot is a prototype decision-support layer. It does not issue an MPI assurance, certificate, or legal market-access determination. Current official requirements must be revalidated before a real export.",
)

api_page(
    story, "5", "customs-clearance", "tariff lookup, classification candidates, cost estimate, and drafts",
    "This API is necessary because Customs preparation combines product lines, classification, freight, insurance, rates, and documents. It separates candidate and verified values, records source metadata, and generates consistent broker-review drafts without implying a declaration was submitted.",
    "fetchOfficialTariffSource(live?: boolean): Promise<TariffSnapshot>\nhsCandidatesFor(product: string): Array<{ code: string; description: string; confidence: number }>\nrunCustomsSkill(input: CustomsInput): Promise<CustomsResult>",
    [
        ("caseId / seller / buyer", "string", "Yes", "Case identity and parties used in document numbers and the commercial invoice."),
        ("origin / destination / currency", "string / \"NZD\"", "Yes", "Trade route and current currency contract."),
        ("lines", "CustomsLine[]", "Yes", "SKU, description, quantity, unit, unitValueNzd, and netWeightKg."),
        ("freightNzd / insuranceNzd", "number", "Yes", "Non-negative cost inputs."),
        ("dutyRate / levyRate / exportGstRate", "number", "Yes", "Case-supplied non-negative rates for transparent calculation."),
        ("classificationEvidence", "boolean", "Yes", "Whether the candidate is supported by broker or tariff evidence."),
        ("liveSourceLookup", "boolean", "No", "When true, fetch and content-check the public tariff page; default false."),
    ],
    "const result = await runCustomsSkill({\n  caseId: \"case-demo-001\", seller: \"Comvita Limited\", buyer: \"Australian importer\",\n  origin: \"New Zealand\", destination: \"Australia\", currency: \"NZD\",\n  lines: [{ sku: \"MH-250-UMF15\", description: \"UMF Mānuka honey 250g\", quantity: 1000, unit: \"jars\", unitValueNzd: 12, netWeightKg: 250 }],\n  freightNzd: 800, insuranceNzd: 100, dutyRate: 0, levyRate: 0.01, exportGstRate: 0,\n  classificationEvidence: true, liveSourceLookup: false\n});",
    "{ status: \"PASS\", hsCandidates: [{ code: \"0409.00\", confidence: 0.9 }],\n  totals: { goodsValueNzd: 12000, freightNzd: 800, insuranceNzd: 100, dutyNzd: 0, levyNzd: 120, exportGstNzd: 0, estimatedLandedValueNzd: 13020 },\n  documents: [\"COMMERCIAL_INVOICE\", \"PACKING_LIST\", \"TSW_DRAFT\"],\n  validationIssues: [], evidenceRefs: [\"customs-evidence_...\"], assumptions: [\"HS code is a candidate...\"]\n}",
    [
        "fetchOfficialTariffSource(false) returns a deterministic snapshot; true uses a five-second timeout, content marker, HTTP metadata, and SHA-256 contentHash.",
        "hsCandidatesFor returns natural-honey candidates; other products return VERIFY_REQUIRED. runCustomsSkill calculates totals and creates three draft document objects.",
        "Missing parties, invalid lines, invalid rates, or required fields produce BLOCKED. Weak classification evidence or failed live verification produces REVIEW.",
        "TSW output is always DRAFT_ONLY with readyForBrokerReview=true; no declaration is submitted.",
    ],
    "Use deterministic mode for tests; liveSourceLookup=true may return REVIEW. Preserve assumptions with totals.",
    "",
)

api_page(
    story, "6", "trade-risk-adversary", "controlled fault injection and negative-path evaluation",
    "This API is necessary because a clean happy path does not prove that a release desk can detect changes after earlier checks passed. The adversarial API tests the six supported incident modes against a clone and preserves the original baseline for comparison.",
    "ALL_FAULTS: FaultType[]\ninjectFault(tradeCase: TradeCase, fault: FaultType): TradeCase\nevaluateFault(tradeCase: TradeCase, fault: FaultType): AdversaryFinding\nrunAdversarySkill(tradeCase: TradeCase, activeFaults?: FaultType[]): AdversaryResult",
    [
        ("tradeCase", "TradeCase", "Yes", "Complete case to clone or evaluate."),
        ("fault", "FaultType", "Yes", "One of fingerprint-mismatch, batch-id-tamper, missing-document, quantity-mismatch, destination-change, rule-version-conflict."),
        ("activeFaults", "FaultType[]", "No", "Selected faults. Empty or omitted means baseline catalogue mode; non-empty means active incident mode."),
    ],
    "const mutated = injectFault(baseCase, \"quantity-mismatch\");\nconst finding = evaluateFault(baseCase, \"quantity-mismatch\");\nconst incident = runAdversarySkill(baseCase, [\"quantity-mismatch\"]);",
    "{\n  finding: { fault: \"quantity-mismatch\", severity: \"CRITICAL\",\n    observed: \"Invoice quantity diverges from the case quantity.\",\n    expectedGate: \"BLOCKED\" },\n  incident: { status: \"BLOCKED\", activeFaults: [\"quantity-mismatch\"],\n    findings: [/* finding above */], evidenceRefs: [\"red-team-evidence_...\"] }\n}",
    [
        "ALL_FAULTS is the explicit catalogue used by the incident demo and acceptance test.",
        "injectFault performs a deep clone before changing one field, so the source TradeCase remains unchanged.",
        "evaluateFault returns a human-readable title, severity, observed behavior, and expectedGate=BLOCKED.",
        "runAdversarySkill with activeFaults returns BLOCKED and findings. With no active faults it returns a PASS baseline result and a catalogue evidence reference.",
    ],
    "Run the baseline workflow first, then call runAdversarySkill with one or more selected faults. Compare the mutated decision with the original baseline and store both outcomes. Use `npm run demo:incident` for the supplied dashboard flow.",
    "Only the six registered FaultType values are supported. This is controlled resilience testing, not unconstrained chaos engineering. An unknown fault should be rejected by the caller rather than invented dynamically.",
)

api_page(
    story, "7", "evidence-monitor", "five-gate audit and final release decision",
    "This API is necessary because individual PASS results do not guarantee a safe release. The monitor combines scientific, custody, MPI, Customs, and adversarial evidence, applies precedence rules, and returns the reasons and next actions a human reviewer needs.",
    "auditTradeCase(tradeCase: TradeCase): MonitorResult\nrenderAuditSummary(result: MonitorResult): string",
    [
        ("tradeCase.fingerprint", "FingerprintResult", "Expected", "Scientific gate and evidenceRefs."),
        ("tradeCase.custody", "CustodyResult", "Expected", "Chain-of-custody gate and evidenceRefs."),
        ("tradeCase.mpi", "MpiResult", "Expected", "Destination market-access gate and evidenceRefs."),
        ("tradeCase.customs", "CustomsResult", "Expected", "Classification and document gate and evidenceRefs."),
        ("tradeCase.adversary", "AdversaryResult", "Expected", "Baseline stress gate; active faults make it BLOCKED."),
    ],
    "const result = auditTradeCase(tradeCase);\nconsole.log(renderAuditSummary(result));",
    "{\n  decision: \"RELEASE\", score: 100,\n  gates: [\n    { gate: \"scientific-fingerprint\", status: \"PASS\", evidenceRefs: [\"...\"] },\n    { gate: \"chain-of-custody\", status: \"PASS\", evidenceRefs: [\"...\"] },\n    { gate: \"mpi-market-access\", status: \"PASS\", evidenceRefs: [\"...\"] },\n    { gate: \"customs-clearance\", status: \"PASS\", evidenceRefs: [\"...\"] },\n    { gate: \"adversarial-stress\", status: \"PASS\", evidenceRefs: [\"...\"] }\n  ],\n  missingEvidence: [],\n  nextActions: [\"Release to broker review with the evidence bundle.\"],\n  evidenceMatrix: { \"scientific-fingerprint\": [\"...\"] }\n}",
    [
        "The five gates are always represented in the evidence matrix, even when an upstream output is missing.",
        "Decision precedence is BLOCKED over REVIEW over RELEASE. A missing output or empty evidenceRefs prevents an unqualified release.",
        "The score starts at 100 and subtracts 25 for each BLOCKED gate, 10 for each REVIEW gate, and 5 for each missing evidence set, bounded at zero.",
        "renderAuditSummary provides a concise text view containing decision, score, gate statuses, evidence counts, and next actions.",
    ],
    "Call auditTradeCase only after the required upstream outputs are present, or call it earlier to obtain a fail-closed diagnostic. Treat RELEASE as a recommendation to broker review, not an autonomous legal or regulatory approval.",
    "The monitor cannot validate the truth of an external document; it validates the structured outputs and references supplied to it. Human review remains required for certificates, laboratory judgments, classification, rates, and final submission.",
)

story += [
    PageBreak(),
    p("Protocol, framework, and trigger APIs", "H1Bee"),
    p("The following APIs are needed when the Skills are embedded in a dashboard, agent framework, or alternate runtime. They preserve one message contract instead of creating a separate adapter contract for every integration.", "BodyBee"),
    p("SkillMessage/v1", "H2Bee"),
    code("interface SkillMessage<T = unknown> {\n  sender: SkillName; receiver: SkillName; protocol: \"SkillMessage/v1\";\n  taskState: \"PENDING\" | \"RUNNING\" | \"SUCCESS\" | \"RETRY\" | \"FAILED\" | \"ERROR\";\n  id: string; caseId: string; correlationId: string; skill: SkillName;\n  type: \"TASK_CREATED\" | \"TASK_STARTED\" | \"TASK_COMPLETED\" |\n        \"TASK_RETRY\" | \"TASK_FAILED\" | \"EVIDENCE_APPENDED\";\n  timestamp: string; attempt: number; status: StageStatus | \"PENDING\" | \"RUNNING\" | \"ERROR\";\n  payload: T; evidenceRefs: string[];\n}"),
    p("Each lifecycle message is necessary for reconstructing who ran what, for which case, on which attempt, with which evidence. Consumers should validate protocol, sender, receiver, IDs, taskState, and evidenceRefs before accepting a trace.", "BodyBee"),
    p("Framework calls", "H2Bee"),
    table([
        head("Call", "Signature", "Use"),
        [cell("runFrameworkRuntime", True), cell("runFrameworkRuntime(plan, tradeCase, handlers, provider?): Promise<FrameworkRuntimeResult>"), cell("Executes the current LangGraph StateGraph adapter or local AgentVerse-compatible mode and returns ordered messages plus runtime summary.")],
        [cell("toAutoGenTeamConfig", True), cell("toAutoGenTeamConfig(plan): AutoGenTeamConfig"), cell("Maps the same DAG to a GraphFlow-compatible team descriptor; it does not start a remote AutoGen runtime.")],
        [cell("toAgentVerseTeamConfig", True), cell("toAgentVerseTeamConfig(plan): AgentVerseTeamConfig"), cell("Maps the plan to planner, workers, observer, and shared schema; it is a local compatibility descriptor.")],
        [cell("validateFrameworkMessages", True), cell("validateFrameworkMessages(messages): string[]"), cell("Returns validation errors. An empty array means the message envelope passes the local protocol checks.")],
        [cell("routeTriggers", True), cell("routeTriggers(input: string): SkillName[]"), cell("Uppercases input and routes all registered trigger words to matching Skills; unknown input returns an empty array.")],
    ], [1.55 * inch, 2.55 * inch, 2.77 * inch]),
    p("Framework example", "H2Bee"),
    code("const plan = createTaskPlan(caseId, parseIntent(intentText));\nconst descriptors = toAutoGenTeamConfig(plan);\nconst errors = validateFrameworkMessages(run.messages);\nif (errors.length > 0) throw new Error(errors.join(\"; \"));"),
    p("Validation and measurement calls", "H2Bee"),
    table([
        head("Call", "Output and necessity"),
        [cell("runAllSelfTests", True), cell("Promise<TestSummary[]>; verifies the seven Skill suites and their local behavior before packaging or release demos.")],
        [cell("runAcceptance", True), cell("Promise<AcceptanceReport>; checks structure, contracts, public source correspondence, runnable examples, live integration, trigger fixtures, E2E, framework bridge, and fail-closed branches.")],
        [cell("calculateBusinessKpis", True), cell("BusinessKpis; reports evidence coverage, fault detection, parallel roots, critical path, messages, and transparent manual/orchestrated minute proxies. Status is TARGET_FOR_PILOT.")],
        [cell("renderDashboardHtml", True), cell("string; creates the self-contained dashboard view of the DAG, gates, runtime, evidence, and red-team results.")],
    ], [1.55 * inch, 5.32 * inch]),
    p("These calls are verification and presentation utilities. They do not replace the seven business gates and should not be used to convert a failed gate into a pass.", "Callout"),
]

story += [
    PageBreak(),
    p("Recommended usage patterns", "H1Bee"),
    p("Pattern A: complete release workflow", "H2Bee"),
    code("import { runTradeCase } from \"./dist/public-api.js\";\n\nconst run = await runTradeCase(\n  \"Release 1000 jars of UMF Mānuka honey from New Zealand to Australia for AU retail review\",\n  { liveSources: false, includeRedTeam: true, runtimeProvider: \"langgraph-stategraph\" }\n);\n\nif (run.baseline.decision === \"RELEASE\") {\n  console.log(\"Send the evidence bundle to broker review\");\n} else {\n  console.log(run.baseline.nextActions);\n}"),
    p("Use this pattern for the judged demo and for the highest-level application integration. The function creates the case, executes the dependency-aware workflow, runs the supported red-team catalogue, and calculates the KPI proxy in one call."),
    p("Pattern B: direct Skill composition", "H2Bee"),
    code("const intent = parseIntent(intentText);\nconst caseData = createDemoCase(intent.raw);\ncaseData.fingerprint = compareFingerprint({\n  batchId: caseData.batchId, sampleCsv: caseData.sampleCsv,\n  reference: caseData.referenceFingerprint,\n  referenceBatchId: caseData.referenceBatchId\n});\ncaseData.custody = runCustodySkill(caseData.batchId, caseData.custodyEvents);\ncaseData.mpi = checkMpiMarketAccess(caseData.destination, caseData.mpiEvidence);\ncaseData.customs = await runCustomsSkill(caseData.customsInput);\ncaseData.adversary = runAdversarySkill(caseData);\ncaseData.monitor = auditTradeCase(caseData);"),
    p("Use direct composition for isolated tests, custom front ends, or controlled replays. Preserve the same output property names and call auditTradeCase only after the upstream properties have been populated."),
    p("Pattern C: live source lookup", "H2Bee"),
    code("const snapshot = await fetchOfficialTariffSource(true);\nif (!snapshot.live) {\n  console.warn(snapshot.note);\n  // Keep the Customs result at REVIEW and request manual verification.\n}"),
    p("Live mode is optional and network-dependent. The deterministic default is preferable for repeatable judging. A live failure is meaningful evidence that the source could not be verified, not a reason to assume the tariff is correct."),
    p("Pattern D: controlled incident response", "H2Bee"),
    code("const baseline = await runTradeCase(undefined, { includeRedTeam: false });\nconst fault = \"destination-change\" as const;\nconst mutated = injectFault(baseline.tradeCase, fault);\nconst finding = evaluateFault(baseline.tradeCase, fault);\nconst incident = runAdversarySkill(baseline.tradeCase, [fault]);\nconst incidentDecision = auditTradeCase({ ...mutated, adversary: incident });"),
    p("Always retain both baseline and incident records. The supported contract expects the baseline to remain RELEASE and each active fault to produce a BLOCKED finding after downstream evaluation."),
    p("Pattern E: command-line verification", "H2Bee"),
    code("cd apps/web\nnpm install\nnpm run build\nnpm test\nnpm run acceptance\nnpm run demo:live\nnpm run demo:incident"),
    p("The compiled dashboard is written to apps/web/dist/beetrust-dashboard.html. The dist directory is generated output; source changes belong under apps/web/src and apps/web/skills. Keep generated output out of source control when the repository's ignore policy requires it."),
]

story += [
    PageBreak(),
    p("Integration checklist and safety boundaries", "H1Bee"),
    table([
        head("Before calling", "Check"),
        [cell("Any Skill", True), cell("Validate required fields, identify the caseId and batchId, and decide whether deterministic or live source mode is appropriate.")],
        [cell("After calling", True), cell("Read status, validation issues or missingEvidence, evidenceRefs, and disclaimer/assumptions. Do not infer PASS from a populated object alone.")],
        [cell("Before release", True), cell("Require the five monitor gates, a non-empty evidence reference for each passing gate, and human approval for the broker hand-off.")],
        [cell("For Customs", True), cell("Treat HS candidates, rates, landed value, and document objects as draft decision support. TSW_DRAFT must remain DRAFT_ONLY.")],
        [cell("For MPI", True), cell("Refresh current destination rules and official assurance evidence; the bundled versioned snapshot is not a production certificate.")],
        [cell("For laboratory data", True), cell("Use accredited records and qualified review; fingerprint similarity is only deterministic prototype triage.")],
        [cell("For custody", True), cell("Retain ordered events, previousHash, hash, and headHash together so verification can be repeated.")],
        [cell("For incidents", True), cell("Use only ALL_FAULTS values, clone before mutation, and compare the incident result with the untouched baseline.")],
    ], [1.45 * inch, 5.42 * inch]),
    p("Worked final decision example", "H2Bee"),
    code("const summary = renderAuditSummary(run.baseline);\n// Decision: RELEASE\n// Score: 100/100\n// PASS    scientific-fingerprint (1 evidence refs)\n// PASS    chain-of-custody (1 evidence refs)\n// PASS    mpi-market-access (7 evidence refs)\n// PASS    customs-clearance (2 evidence refs)\n// PASS    adversarial-stress (1 evidence refs)\n// Next actions:\n// - Release to broker review with the evidence bundle.\n// - Retain source snapshots, hashes and generated drafts with the case."),
    p("Implementation references", "H2Bee"),
    p("The API contract is implemented in apps/web/src/public-api.ts, apps/web/src/types.ts, apps/web/src/workflow.ts, apps/web/src/framework-runtime.ts, apps/web/src/framework-bridge.ts, apps/web/src/kpis.ts, apps/web/src/trigger-registry.ts, and the seven apps/web/src/skills/*/index.ts modules. Canonical Skill contracts, resources, and runnable examples are under apps/web/skills."),
    p("Verification evidence", "H2Bee"),
    p("The repository verification workflow is npm run build, npm test, npm run acceptance, npm run demo:live, and npm run demo:incident. The API documentation describes the contract that those commands exercise; it does not substitute static inspection for execution."),
    p("Final boundary", "H2Bee"),
    p("BeeTrust returns explainable prototype decisions for broker review. It does not issue a legal release, guarantee market access, certify a laboratory result, determine a final HS classification, submit to TSW, or claim historical enterprise savings. The KPI output is labelled TARGET_FOR_PILOT until operator telemetry is collected.", "Callout"),
]

doc = SimpleDocTemplate(str(OUT), pagesize=letter, rightMargin=0.56 * inch, leftMargin=0.56 * inch, topMargin=0.55 * inch, bottomMargin=0.66 * inch, title="API Documentation", author="BeeTrust project team")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f"Wrote {OUT}")
