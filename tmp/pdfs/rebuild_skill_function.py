from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf" / "Skill Function Description Revised with References.pdf"
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
styles.add(ParagraphStyle(name="H1Bee", fontName="BeeSans-Bold", fontSize=16, leading=20, textColor=NAVY, spaceBefore=11, spaceAfter=7))
styles.add(ParagraphStyle(name="H2Bee", fontName="BeeSans-Bold", fontSize=11.3, leading=15, textColor=TEAL, spaceBefore=8, spaceAfter=4))
styles.add(ParagraphStyle(name="BodyBee", fontName="BeeSans", fontSize=9.05, leading=13, textColor=INK, spaceAfter=6))
styles.add(ParagraphStyle(name="SmallBee", fontName="BeeSans", fontSize=7.35, leading=9.7, textColor=INK, spaceAfter=3))
styles.add(ParagraphStyle(name="SmallMuted", fontName="BeeSans", fontSize=7.2, leading=9.5, textColor=MUTED, spaceAfter=2))
styles.add(ParagraphStyle(name="TableHead", fontName="BeeSans-Bold", fontSize=7.25, leading=9, textColor=colors.white))
styles.add(ParagraphStyle(name="TableCell", fontName="BeeSans", fontSize=7.05, leading=9.1, textColor=INK))
styles.add(ParagraphStyle(name="TableCellBold", fontName="BeeSans-Bold", fontSize=7.05, leading=9.1, textColor=NAVY))
styles.add(ParagraphStyle(name="CodeBee", fontName="BeeMono", fontSize=7.25, leading=10, textColor=INK, backColor=PALE, borderColor=GRID, borderWidth=0.5, borderPadding=6, spaceBefore=3, spaceAfter=7))
styles.add(ParagraphStyle(name="Callout", fontName="BeeSans-Bold", fontSize=9.05, leading=13, textColor=NAVY, backColor=PALE_TEAL, borderColor=TEAL, borderWidth=0.8, borderPadding=8, spaceBefore=5, spaceAfter=8))
styles.add(ParagraphStyle(name="ReferenceBee", fontName="BeeSans", fontSize=7.25, leading=10.2, textColor=INK, leftIndent=12, firstLineIndent=-12, spaceAfter=5))


def p(text, style="BodyBee"):
    return Paragraph(text, styles[style])


def code(text):
    return Paragraph(escape(text).replace("\n", "<br/>"), styles["CodeBee"])


def bullet(text):
    return p(f"<font color='{TEAL}'>•</font> {text}")


def reference(text):
    return p(text, "ReferenceBee")


def cell(text, bold=False):
    return p(escape(text).replace("\n", "<br/>"), "TableCellBold" if bold else "TableCell")


def head(*items):
    return [p(item, "TableHead") for item in items]


def table(rows, widths):
    result = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
    commands = [
        ("GRID", (0, 0), (-1, -1), 0.45, GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
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
    canvas.drawString(doc.leftMargin, 0.29 * inch, "BeeTrust Honey Export Release Desk | Track B Commerce | Skill functions")
    canvas.drawRightString(width - doc.rightMargin, 0.29 * inch, f"Page {doc.page}")
    canvas.restoreState()


def skill_section(story, name, title, purpose, pain, features, input_text, output_text, normal_case, exception_case, value):
    if name != "1. orchestration-hub":
        story.append(PageBreak())
    story.append(p(f"{name}: {title}", "H1Bee"))
    story.append(p(f"<b>Feature introduction.</b> {purpose}", "BodyBee"))
    story.append(p(f"<b>Commercial pain addressed.</b> {pain}", "BodyBee"))
    story.append(p("<b>Core features.</b>", "H2Bee"))
    for item in features:
        story.append(bullet(item))
    story.append(table([
        head("Interface area", "Implementation contract"),
        [cell("Input", True), cell(input_text)],
        [cell("Output", True), cell(output_text)],
        [cell("Normal use case", True), cell(normal_case)],
        [cell("Exception use case", True), cell(exception_case)],
        [cell("Business value", True), cell(value)],
    ], [1.25 * inch, 5.68 * inch]))


story = [
    Spacer(1, 0.18 * inch),
    p("BEETRUST / TRACK B COMMERCE", "H2Bee"),
    p("Skill Function Description", "TitleBee"),
    p("Detailed feature introduction, business pain mapping, and use cases", "SubtitleBee"),
    HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=15),
    p("What the package does", "H1Bee"),
    p("BeeTrust is a TypeScript release desk for a cross-border New Zealand honey export case [11]. It transforms one trade intent into a coordinated evidence workflow, tests the workflow against controlled faults, and returns a release recommendation for broker review. The package is designed for Commerce: the output is not a general information answer, but an auditable business-process decision with evidence, next actions, and explicit human-review boundaries.", "BodyBee"),
    p("Supported case: Release 1000 jars of Manuka honey from New Zealand to Australia for Australian retail review.", "Callout"),
    p("The commercial problem", "H1Bee"),
    p("An export release decision is often distributed across several hand-offs. Scientific evidence may be separated from custody records; destination requirements may be checked using an old rule snapshot; Customs teams may prepare the same documents repeatedly; and a clean happy path may not expose what happens when a quantity, destination, document, or rule version changes. Destination-specific export requirements and certificate evidence must be checked before release [1-3], while tariff classification and export-clearance data must be current and complete [4-6]. BeeTrust brings these decisions into one traceable loop.", "BodyBee"),
    table([
        head("Business pain", "Operational consequence", "BeeTrust response", "Observable indicator"),
        [cell("Evidence is fragmented across teams and systems."), cell("Slow manual reconciliation, missing references, and weak auditability."), cell("Five-gate evidence matrix with structured evidenceRefs and next actions."), cell("Baseline evidence coverage: 100%.")],
        [cell("Batch identity can change between farm, processor, warehouse, and carrier."), cell("A wrong or altered batch can pass through a hand-off unnoticed."), cell("SHA-256 chain with previousHash, hash, headHash, and tamperedEventIds."), cell("Supported custody tamper fault: BLOCKED.")],
        [cell("Market-access requirements are destination-specific and time-sensitive [1-3]."), cell("Stale or incomplete evidence creates rework, delay, or compliance risk."), cell("Versioned MPI rules and explicit checks for required evidence and freshness."), cell("Australia snapshot: MPI-AU-2026.09, 7/7 checks PASS.")],
        [cell("Classification and paperwork consume repeat operator time [4-7]."), cell("Broker preparation starts from scattered data and assumptions."), cell("HS candidates, landed-cost estimate, invoice, packing list, and TSW draft objects."), cell("Three draft documents; landed-value estimate NZD 13,020 in baseline.")],
        [cell("The happy path does not prove resilience."), cell("A small change can create a late-stage incident or unsafe release."), cell("Clone-preserving red-team replay and fail-closed evidence monitoring."), cell("Six supported faults detected as BLOCKED.")],
    ], [1.33 * inch, 1.45 * inch, 2.22 * inch, 1.93 * inch]),
    p("How the business loop works", "H1Bee"),
    code("Trade intent\n  -> plan and dispatch\n  -> [scientific evidence || custody || MPI market access]\n  -> Customs preparation\n  -> controlled adversarial replay\n  -> evidence-monitor release gate\n  -> broker review, next actions, and retained evidence"),
    p("Three root Skills start independently. Customs waits for MPI market access; adversarial testing waits for all operational outputs; evidence-monitor is the final decision point. Same-level work is concurrent, but results are committed in deterministic plan order. The local runtime adapter uses a LangGraph StateGraph execution model [10, 11]. Every lifecycle event uses SkillMessage/v1, so the workflow can be inspected as a runtime trace rather than treated as an opaque answer [11].", "BodyBee"),
    p("Package-level feature summary", "H1Bee"),
    table([
        head("Feature", "What the user can do", "Why it matters commercially"),
        [cell("Natural-language intake", True), cell("Submit one trade sentence and let orchestration-hub extract product, origin, destination, quantity, unit, and priority."), cell("Reduces the setup burden for a release desk and creates one case identity for downstream work.")],
        [cell("Parallel evidence checks", True), cell("Run fingerprint, custody, and MPI checks as independent roots."), cell("Shortens the dependency-aware path and makes bottlenecks visible.")],
        [cell("Versioned knowledge", True), cell("Use dated MPI and Customs snapshots mapped to source IDs, code paths, and self-tests."), cell("Makes domain assumptions inspectable and refreshable instead of hiding them in prompts.")],
        [cell("Draft document generation", True), cell("Produce commercial invoice, packing list, and draft-only TSW objects from case data."), cell("Reduces repeated preparation while keeping broker submission and approval explicit.")],
        [cell("Red-team replay", True), cell("Inject six supported faults into a cloned case and observe the blocked gate."), cell("Tests operational resilience before a real case reaches a release decision.")],
        [cell("Evidence-based release gate", True), cell("Receive RELEASE, REVIEW, or BLOCKED with a score, gate reasons, missing evidence, and next actions."), cell("Turns fragmented checks into a repeatable control point and preserves human accountability.")],
    ], [1.35 * inch, 2.82 * inch, 2.76 * inch]),
    PageBreak(),
]


skill_section(
    story, "1. orchestration-hub", "Trade intent and workflow coordination",
    "This is the incident commander of the package. It parses a natural-language export intent, creates a dependency-aware six-node DAG, dispatches the downstream Skills, handles retry budget, and emits the shared SkillMessage/v1 lifecycle record. It makes the order and dependency of work explicit before any release conclusion is produced.",
    "Operators otherwise have to decide what to check first, remember which checks depend on each other, and reconcile status messages from separate tools. That creates coordination delay and makes it difficult to prove that a final release decision used all required steps.",
    [
        "Intent parsing for product, origin, destination, quantity, unit, and urgent versus normal priority.",
        "A fixed business DAG: three parallel roots, Customs after MPI, adversary after operational evidence, and monitor last.",
        "Concurrent same-level execution with deterministic plan-order commits for repeatable demos and tests.",
        "Two-attempt task budget with TASK_RETRY and TASK_FAILED lifecycle events for transient handler errors.",
        "Plan visualization through renderPlanLevels and runtime trace through renderRuntimeTimeline.",
    ],
    "raw: string trade intent; optional TradeCase and TaskPlan context for handlers.",
    "TradeIntent, TaskPlan, and ordered SkillMessage/v1 lifecycle events containing sender, receiver, status, attempt, payload, and evidenceRefs.",
    "A broker enters the supported Australia export sentence. The system creates one case ID and starts fingerprint, custody, and MPI work without waiting for unrelated checks.",
    "An empty intent, missing handler, or dependency cycle fails explicitly. A transient handler error creates a retry event; an exhausted retry budget creates TASK_FAILED instead of silently continuing.",
    "Reduces coordination overhead, prevents skipped stages, and creates the execution trace needed for audit and performance measurement.",
)

skill_section(
    story, "2. fingerprint-evidence", "Scientific batch evidence comparison",
    "This Skill parses a laboratory CSV or report extract, normalizes known honey-marker aliases, compares the sample to a reference batch, and returns similarity, confidence, anomalies, and an evidence reference. The rule is deterministic and explainable: completeness and per-feature relative distance drive PASS, REVIEW, or BLOCKED.",
    "A release team may receive a file with different marker names, missing values, or borderline measurements. Manual comparison is slow and can hide an incomplete sample behind a simple pass or fail label.",
    [
        "Accepts comma, semicolon, tab, or colon-separated feature rows and skips comments and header rows.",
        "Normalizes aliases such as MG, DHA, HMF, sugar profile, pollen DNA, moisture, conductivity, and delta13C.",
        "Calculates tolerance, relative distance, completeness, similarity, and confidence for the available reference features.",
        "Labels missing data and tolerance breaches as anomalies with a deterministic lab evidence reference.",
        "Discloses that prototype similarity scoring is triage support, not a laboratory certificate, UMF licence, or MPI assurance.",
    ],
    "FingerprintInput: batchId, sampleCsv, reference marker map, and referenceBatchId.",
    "FingerprintResult: status, marker features, similarity, confidence, anomalies, anomaliesDetected, evidenceRefs, and disclaimer.",
    "The sample matches the reference vector. The Skill returns PASS, similarity 1, confidence 1, no anomalies, and a stable lab evidence reference for the release matrix.",
    "Malformed CSV, duplicate or non-finite values, missing markers, or a large mismatch returns BLOCKED; a borderline match returns REVIEW so a human can request a better sample or accredited review.",
    "Reduces manual scientific triage and stops incomplete evidence from being treated as a clean match.",
)

skill_section(
    story, "3. custody-ledger", "Tamper-evident chain of custody",
    "This Skill builds and verifies a SHA-256 hash chain for farm, processor, warehouse, and carrier events [9]. Each event records a previousHash and hash; the final headHash represents the reproducible chain tip. The implementation verifies payload, link, ordering, and batch identity.",
    "A cross-border batch passes through multiple physical and organizational hand-offs. If an event is edited or linked to a different batch, an ordinary list of events may not make the change obvious to the reviewer.",
    [
        "Starts from a GENESIS value and links each canonical event to the previous hash.",
        "Checks event IDs, timestamps, actors, locations, actions, quantities, batch IDs, and optional metadata.",
        "Returns the complete chained events, headHash, tamperedEventIds, and custody evidence reference.",
        "Provides verifyHashChain for independent verification of an already chained list.",
        "States the boundary clearly: this is an evidence-integrity layer, not a public blockchain or legal title registry.",
    ],
    "Ordered CustodyEventInput[] plus a batch ID when using runCustodySkill.",
    "CustodyResult with PASS or BLOCKED, chained events, previousHash, hash, headHash, tamperedEventIds, and evidenceRefs.",
    "Four fixture events move the batch from farm harvest to processor pack, warehouse release, and carrier booking. The headHash is retained as evidence for the release gate.",
    "Empty events, a wrong batch ID, altered payload, invalid timestamp, duplicate event ID, or broken hash link blocks the case and identifies affected event IDs.",
    "Reduces the cost of manual reconciliation and exposes batch identity risk before it becomes a broker or customer dispute.",
)

skill_section(
    story, "4. mpi-market-access", "Destination-specific market access evidence",
    "This Skill evaluates a versioned market-access snapshot for the destination. It checks listed beekeeper status, harvest declaration, RMP, OMAR, export certificate, trade certification, evidence freshness, and rule-version alignment, following the public export and certificate guidance used by the project [1-3]. The Australia fixture uses MPI-AU-2026.09 and returns check-level evidence references.",
    "Export requirements differ by destination and change over time. Missing or stale documentation is often discovered late, when the shipment or broker packet is already being prepared.",
    [
        "Resolves destination aliases such as AU and Australia to a versioned market rule.",
        "Checks mandatory evidence separately so the reviewer can see exactly what is missing.",
        "Applies a prototype freshness window of 0 to 365 days and detects evidence rule-version conflicts.",
        "Uses fail-closed behavior for unknown markets, stale evidence, missing OMAR, missing documents, and version mismatch.",
        "Returns source URLs and a disclaimer that the Skill recommends; it does not issue an MPI assurance or certificate.",
    ],
    "destination: string and MpiEvidence containing the evidence flags, OMAR state, declaration date, freshness days, and optional ruleVersion.",
    "MpiResult with status, destination, ruleVersion, checks, missingEvidence, evidenceRefs, sourceUrls, and disclaimer.",
    "The Australia evidence snapshot satisfies all seven checks, including freshness and rule alignment, so Customs can proceed with a known market context.",
    "Unknown destination, negative or stale freshness, missing mandatory evidence, expired OMAR, or mismatched ruleVersion returns BLOCKED with reasons and references.",
    "Reduces rework and late compliance surprises by making destination evidence a visible gate before document drafting.",
)

skill_section(
    story, "5. customs-clearance", "Classification, landed cost, and broker-ready drafts",
    "This Skill creates candidate HS classifications, calculates a transparent landed-value estimate from case-supplied rates, performs an optional live fetch of the public NZ Customs tariff page, and generates commercial invoice, packing list, and draft-only TSW objects [4-7]. It retains assumptions instead of presenting a candidate as a final legal classification.",
    "Customs preparation repeatedly combines product lines, values, freight, insurance, rates, and source checks. Manual assembly increases the chance of inconsistent values and makes it difficult to distinguish a verified source from a case assumption.",
    [
        "Maps honey or Manuka product descriptions to candidate HS 0409.00 entries using the tariff source as the external confirmation point; non-honey products return VERIFY_REQUIRED [4].",
        "Calculates goods value, freight, insurance, duty, levy, export GST, and estimated landed value with rounded totals.",
        "In live mode, fetches the public tariff page, checks a content marker, and records HTTP status, content length, and SHA-256 hash [4, 9].",
        "Generates COMMERCIAL_INVOICE, PACKING_LIST, and TSW_DRAFT with shared case data and evidence references.",
        "Sets submission=DRAFT_ONLY and produces manual verification assumptions when source content is unavailable or classification evidence is weak.",
    ],
    "CustomsInput: seller, buyer, origin, destination, currency, invoice lines, freight, insurance, case-supplied rates, classificationEvidence, and optional liveSourceLookup.",
    "CustomsResult with HS candidates, totals, validationIssues, sourceUrls, assumptions, source snapshot data, evidenceRefs, and three document objects.",
    "The baseline estimates NZD 13,020 landed value, returns the natural honey candidates, and creates invoice, packing list, and TSW draft objects for broker review.",
    "Missing parties, invalid lines, negative or non-finite rates return BLOCKED. An unavailable live tariff source returns REVIEW with a manual verification action. No TSW submission occurs.",
    "Reduces repetitive preparation and calculation errors while preserving the broker's authority to confirm classification, rates, and submission.",
)

skill_section(
    story, "6. trade-risk-adversary", "Controlled fault injection and stress testing",
    "This Skill replays six supported fault modes against a deep clone of the case: fingerprint mismatch, custody batch tampering, missing documents, quantity mismatch, destination change, and rule-version conflict. It observes the resulting finding and expected BLOCKED gate without mutating the baseline [11].",
    "A demo or pilot that only shows the clean path cannot prove that a small data change will be detected. Real incidents often come from disagreement between fields that were valid earlier in the workflow.",
    [
        "Maintains an explicit ALL_FAULTS catalogue so test coverage is inspectable and repeatable.",
        "Deep-clones the TradeCase before mutation, preserving the original baseline for comparison.",
        "Returns a finding with fault, title, severity, observed behavior, and expectedGate=BLOCKED.",
        "Supports dry-run catalogue mode and active-fault mode for both demonstration and automated testing.",
        "Makes incident behavior visible in the dashboard and in the evidence-monitor decision.",
    ],
    "Complete TradeCase plus zero or more FaultType values from the supported catalogue.",
    "AdversaryResult with status, activeFaults, findings, optional mutatedCase, and red-team evidence reference.",
    "The dashboard begins with a RELEASE baseline, then the operator selects one fault. The cloned case is re-evaluated and the affected gate becomes BLOCKED.",
    "Unknown faults or fields that cannot be mutated are reported as controlled findings; the source case is not changed. Every active supported fault is expected to block.",
    "Reduces operational risk by turning resilience from a claim into a repeatable pre-release test with observable evidence.",
)

skill_section(
    story, "7. evidence-monitor", "Evidence matrix and final release gate",
    "This Skill is the final auditor. It applies one evidence matrix across scientific fingerprint, chain of custody, MPI market access, Customs clearance, and adversarial stress. It emits RELEASE, REVIEW, or BLOCKED with a score, gate reasons, missing evidence, and next actions.",
    "Without one final gate, teams may combine a successful scientific check with missing market evidence or an unresolved Customs issue. A score alone can also hide missing references. The monitor makes release precedence explicit.",
    [
        "Requires all five release gates and at least one evidence reference for a passing gate.",
        "Uses decision precedence BLOCKED over REVIEW over RELEASE; missing evidence is never silently ignored.",
        "Produces an evidenceMatrix keyed by gate, a score, missingEvidence, and actionable nextActions.",
        "Returns a broker-review recommendation rather than claiming independent shipment authority.",
        "Renders a concise audit summary for terminal, API, and dashboard use.",
    ],
    "TradeCase containing the outputs of the six operational roles, including status and evidence references.",
    "MonitorResult with decision, score, five gates, missingEvidence, nextActions, and evidenceMatrix.",
    "All five baseline gates pass and contain references, so the monitor returns RELEASE 100/100 and instructs the team to release to broker review while retaining hashes, snapshots, and drafts.",
    "A missing role output, blocked upstream gate, review state, or empty evidence reference produces BLOCKED or REVIEW with a concrete reason and next action.",
    "Converts distributed checks into a repeatable control decision, reducing unsafe release risk and making the work auditable.",
)

story += [
    PageBreak(),
    p("End-to-end use cases", "H1Bee"),
    p("Use case A: clean release for Australian retail review", "H2Bee"),
    p("A broker or exporter enters the supported trade intent. orchestration-hub creates the plan and starts three root checks. fingerprint-evidence confirms the sample against the reference profile; custody-ledger verifies four hand-offs; mpi-market-access validates the Australia snapshot. Customs then produces the candidate classification, estimate, and draft documents. The adversary runs a baseline dry run, and evidence-monitor returns RELEASE only after all five gates have evidence.", "BodyBee"),
    table([
        head("Observed output", "Value", "Commercial meaning"),
        [cell("Final decision", True), cell("RELEASE 100/100"), cell("The package recommends broker review with a complete evidence bundle.")],
        [cell("Execution shape", True), cell("3 parallel roots; 10 dependency edges; 4 critical-path stages"), cell("Coordination and bottlenecks are visible instead of hidden in manual hand-offs.")],
        [cell("Evidence", True), cell("100% coverage across 5 gates"), cell("Every passing gate has a reference that can be retained with the case.")],
        [cell("Documents", True), cell("COMMERCIAL_INVOICE, PACKING_LIST, TSW_DRAFT"), cell("The broker receives consistent drafts without implying submission.")],
        [cell("Trace", True), cell("12 SkillMessage/v1 messages"), cell("The runtime can be reconstructed from structured lifecycle events.")],
    ], [1.45 * inch, 2.0 * inch, 3.48 * inch]),
    p("Use case B: live Customs source check", "H2Bee"),
    p("The operator runs npm run demo:live or passes liveSourceLookup=true. customs-clearance fetches the public NZ Customs tariff page [4], verifies a tariff/classification content marker, and records a SHA-256 snapshot hash [9]. If the page is unavailable or cannot be verified, the result is REVIEW and the operator receives a manual tariff-verification action. This prevents a source outage from being mistaken for a verified tariff decision.", "BodyBee"),
    p("Use case C: controlled incident response", "H2Bee"),
    p("The operator runs npm run demo:incident and selects a fault. trade-risk-adversary clones the baseline, applies the selected mutation, and runs the downstream checks. Examples include changing the first custody event's batch ID, removing MPI documents, increasing invoice quantity, changing the destination, or creating a rule-version conflict. The mutated case must become BLOCKED, while the original baseline remains RELEASE.", "BodyBee"),
    p("Use case D: invalid-input and human-review branch", "H2Bee"),
    p("An incomplete or borderline input does not disappear into a generic error. A malformed fingerprint becomes BLOCKED; an unknown market becomes BLOCKED; an invalid Customs line becomes BLOCKED; an unverifiable live source becomes REVIEW. These branches give the operator a concrete next action and are covered by the acceptance report.", "BodyBee"),
    p("Use case E: developer and workspace integration", "H2Bee"),
    code("cd apps/web\nnpm install\nnpm run build\nnpm test\nnpm run acceptance\nnpm run demo:live\nnpm run demo:incident"),
    p("The compiled dashboard is written to apps/web/dist/beetrust-dashboard.html. The public TypeScript API is re-exported from apps/web/src/public-api.ts. Each Skill also includes SKILL.md, TypeScript logic, tests, a resource, and a runnable example.", "BodyBee"),
    p("How the package solves the commercial pain", "H1Bee"),
    table([
        head("Pain reduction mechanism", "What changes in the operating process", "Prototype evidence and pilot measure"),
        [cell("Less coordination delay", True), cell("The plan identifies dependencies and runs independent roots concurrently instead of serializing every check."), cell("3 parallel roots and 4-stage critical path; measure median case triage time in pilot.")],
        [cell("Less evidence rework", True), cell("Each gate carries evidenceRefs and the final matrix lists missing evidence and next actions."), cell("100% baseline coverage; measure evidence completeness and rework count.")],
        [cell("Less batch-integrity risk", True), cell("Hash links make payload or batch changes observable before release."), cell("Six incident replays remain baseline-safe; measure supported fault detection >= 95%.")],
        [cell("Less document preparation", True), cell("Case data is reused across classification, cost calculation, invoice, packing list, and TSW draft objects."), cell("3 generated draft objects; measure manual document minutes and correction count.")],
        [cell("More transparent decisions", True), cell("The output is RELEASE, REVIEW, or BLOCKED with reasons and human next actions, never a hidden confidence claim."), cell("198 self-tests and all acceptance checks passed; measure reviewer trust and resolution time.")],
    ], [1.55 * inch, 3.0 * inch, 2.38 * inch]),
    p("Measured prototype indicators and limits", "H1Bee"),
    p("The executed deterministic fixture reports 108 estimated manual minutes and 32 estimated orchestrated minutes, a 70% time-reduction proxy. It also reports 100% evidence coverage, 100% supported-fault detection, 3 parallel root agents, 4 critical-path stages, and 12 runtime messages. These values are transparent prototype calculations marked TARGET_FOR_PILOT in the TypeScript model. They are not historical savings or a claim about Comvita's actual operations.", "Callout"),
    p("The enterprise context is synthetic and uses Comvita's public investor page only [8]. Before production use, an authorised exporter and broker must refresh MPI and Customs sources [1-7], replace fixture data with authorised records, confirm laboratory evidence, validate classification and rates, and retain human approval. BeeTrust recommends release to broker review; it does not issue certificates, replace accredited laboratory judgment, or submit to TSW [6].", "BodyBee"),
    p("Implementation evidence", "H1Bee"),
    p("Relevant files: apps/web/src/workflow.ts, apps/web/src/skills/*/index.ts, apps/web/src/acceptance.ts, apps/web/src/kpis.ts, apps/web/src/public-api.ts, apps/web/skills/*/SKILL.md, apps/web/knowledge/, and apps/web/evidence-source-register.json [11]. Executed validation: npm run build passed; npm test passed 198 cases with zero failures; npm run acceptance passed; npm run demo:live returned HTTP 200 with a verified tariff marker; npm run demo:incident replayed all six supported faults as BLOCKED while retaining a RELEASE baseline [11].", "SmallBee"),
    PageBreak(),
    p("References", "H1Bee"),
    p("APA 7th edition format. Bracketed numbers in the body correspond to the entries below. Web sources were accessed September 26, 2026; dynamic regulatory and tariff pages should be revalidated before production use.", "SmallMuted"),
    reference("[1] New Zealand Ministry for Primary Industries. (n.d.-a). <i>Steps to exporting honey and bee products</i>. Retrieved September 26, 2026, from https://www.mpi.govt.nz/export/food/honey-and-bee-products/steps-to-exporting"),
    reference("[2] New Zealand Ministry for Primary Industries. (n.d.-b). <i>Honey and bee products: Requirements</i>. Retrieved September 26, 2026, from https://www.mpi.govt.nz/export/food/honey-and-bee-products/requirements"),
    reference("[3] New Zealand Ministry for Primary Industries. (n.d.-c). <i>Animal product export certificates</i>. Retrieved September 26, 2026, from https://www.mpi.govt.nz/export/export-requirements/export-certification/animal-product-export-certificates"),
    reference("[4] New Zealand Customs Service. (n.d.-a). <i>Tariff classifications and rates</i>. Retrieved September 26, 2026, from https://www.customs.govt.nz/business/tariffs/tariff-classifications-and-rates"),
    reference("[5] New Zealand Customs Service. (n.d.-b). <i>Clear your exports</i>. Retrieved September 26, 2026, from https://www.customs.govt.nz/business/export/clear-your-exports"),
    reference("[6] New Zealand Customs Service. (n.d.-c). <i>Getting started with Trade Single Window</i>. Retrieved September 26, 2026, from https://www.customs.govt.nz/business/trade-single-window-tsw/getting-started"),
    reference("[7] New Zealand Ministry of Foreign Affairs and Trade. (n.d.). <i>Guide to using free trade agreements for goods exporters</i>. Retrieved September 26, 2026, from https://www.mfat.govt.nz/en/trade/how-we-help-exporters/guide-to-using-free-trade-agreements-for-goods-exporters"),
    reference("[8] Comvita Limited. (n.d.). <i>Investor centre</i>. Retrieved September 26, 2026, from https://comvita.co.nz/pages/investor-centre"),
    reference("[9] National Institute of Standards and Technology. (2015). <i>Secure Hash Standard (SHS)</i> (FIPS PUB 180-4). U.S. Department of Commerce. https://doi.org/10.6028/NIST.FIPS.180-4"),
    reference("[10] LangChain, Inc. (n.d.). <i>LangGraph overview</i>. Retrieved September 26, 2026, from https://docs.langchain.com/oss/javascript/langgraph/overview"),
    reference("[11] BeeTrust project team. (2026). <i>BeeTrust Honey Export Release Desk</i> [Computer software and source code]. Unpublished project repository."),
]


doc = SimpleDocTemplate(str(OUT), pagesize=letter, rightMargin=0.58 * inch, leftMargin=0.58 * inch, topMargin=0.58 * inch, bottomMargin=0.66 * inch, title="Skill Function Description", author="BeeTrust project team")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f"Wrote {OUT}")
