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
OUT = ROOT / "output" / "pdf" / "Enterprise Challenge Fit Statement Updated.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

pdfmetrics.registerFont(TTFont("BeeSans", r"C:\Windows\Fonts\DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("BeeSans-Bold", r"C:\Windows\Fonts\DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("BeeMono", r"C:\Windows\Fonts\DejaVuSansMono.ttf"))

NAVY = colors.HexColor("#17324D")
TEAL = colors.HexColor("#0B7A75")
GOLD = colors.HexColor("#D49A2A")
PALE = colors.HexColor("#F2F6F8")
PALE_TEAL = colors.HexColor("#E7F3F1")
PALE_GOLD = colors.HexColor("#FFF6DF")
INK = colors.HexColor("#1D2935")
MUTED = colors.HexColor("#5B6B78")
GRID = colors.HexColor("#C9D5DB")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleBee", fontName="BeeSans-Bold", fontSize=24, leading=29, textColor=NAVY, spaceAfter=8))
styles.add(ParagraphStyle(name="SubtitleBee", fontName="BeeSans", fontSize=10.8, leading=15, textColor=MUTED, spaceAfter=15))
styles.add(ParagraphStyle(name="H1Bee", fontName="BeeSans-Bold", fontSize=16, leading=20, textColor=NAVY, spaceBefore=11, spaceAfter=7))
styles.add(ParagraphStyle(name="H2Bee", fontName="BeeSans-Bold", fontSize=11.3, leading=15, textColor=TEAL, spaceBefore=8, spaceAfter=4))
styles.add(ParagraphStyle(name="BodyBee", fontName="BeeSans", fontSize=9.0, leading=13, textColor=INK, spaceAfter=6))
styles.add(ParagraphStyle(name="SmallBee", fontName="BeeSans", fontSize=7.35, leading=9.7, textColor=INK, spaceAfter=3))
styles.add(ParagraphStyle(name="SmallMuted", fontName="BeeSans", fontSize=7.2, leading=9.5, textColor=MUTED, spaceAfter=2))
styles.add(ParagraphStyle(name="TableHead", fontName="BeeSans-Bold", fontSize=7.15, leading=8.9, textColor=colors.white))
styles.add(ParagraphStyle(name="TableCell", fontName="BeeSans", fontSize=6.95, leading=8.8, textColor=INK))
styles.add(ParagraphStyle(name="TableCellBold", fontName="BeeSans-Bold", fontSize=6.95, leading=8.8, textColor=NAVY))
styles.add(ParagraphStyle(name="CodeBee", fontName="BeeMono", fontSize=7.15, leading=9.7, textColor=INK, backColor=PALE, borderColor=GRID, borderWidth=0.5, borderPadding=6, spaceBefore=3, spaceAfter=7))
styles.add(ParagraphStyle(name="Callout", fontName="BeeSans-Bold", fontSize=9.0, leading=13, textColor=NAVY, backColor=PALE_TEAL, borderColor=TEAL, borderWidth=0.8, borderPadding=8, spaceBefore=5, spaceAfter=8))
styles.add(ParagraphStyle(name="WarningCallout", fontName="BeeSans-Bold", fontSize=8.8, leading=12.5, textColor=NAVY, backColor=PALE_GOLD, borderColor=GOLD, borderWidth=0.8, borderPadding=8, spaceBefore=5, spaceAfter=8))
styles.add(ParagraphStyle(name="ReferenceBee", fontName="BeeSans", fontSize=7.2, leading=10.1, textColor=INK, leftIndent=12, firstLineIndent=-12, spaceAfter=5))


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


def rich_cell(text, bold=False):
    return p(text, "TableCellBold" if bold else "TableCell")


def head(*items):
    return [p(item, "TableHead") for item in items]


def table(rows, widths, header=True, row_heights=None):
    result = Table(rows, colWidths=widths, repeatRows=1 if header else 0, rowHeights=row_heights, hAlign="LEFT")
    commands = [
        ("GRID", (0, 0), (-1, -1), 0.45, GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        commands.append(("BACKGROUND", (0, 0), (-1, 0), NAVY))
        start = 1
    else:
        start = 0
    for row in range(start, len(rows)):
        commands.append(("BACKGROUND", (0, row), (-1, row), colors.white if (row - start) % 2 else PALE))
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
    canvas.drawString(doc.leftMargin, 0.29 * inch, "BeeTrust Honey Export Release Desk | Enterprise challenge fit")
    canvas.drawRightString(width - doc.rightMargin, 0.29 * inch, f"Page {doc.page}")
    canvas.restoreState()


story = [
    Spacer(1, 0.18 * inch),
    p("BEETRUST / TRACK B COMMERCE", "H2Bee"),
    p("Enterprise Challenge Fit Statement", "TitleBee"),
    p("A New Zealand enterprise case for cost reduction, evidence quality, and faster export-release decisions", "SubtitleBee"),
    HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=15),
    p("Enterprise selected: Comvita Limited (NZX: CVT)", "H1Bee"),
    p("Comvita is a real New Zealand company founded in 1974, with more than 400 people, operations across New Zealand, Australia, Greater China, North America, Japan, Korea, and Southeast Asia, and a vertically integrated Manuka honey supply chain that runs from New Zealand forests and beehives to international omni-channel distribution [1]. Its public investor materials also describe company-owned apiaries, an accredited laboratory, supply and operations leadership, S&OP, procurement, and an explicit FY27 focus on supply-chain efficiency and return on existing assets [1, 2].", "BodyBee"),
    p("This makes Comvita a credible enterprise fit for BeeTrust: the company has the product, origin, multi-market distribution, quality, inventory, and export-evidence characteristics that the prototype is built to coordinate.", "Callout"),
    p("Purpose of this statement", "H1Bee"),
    p("This statement explains how BeeTrust addresses a real enterprise problem for Comvita: reducing avoidable coordination and evidence-rework effort in cross-border Manuka honey release decisions while improving visibility of batch, market-access, Customs, and incident evidence. It also supplies quantified pilot indicators for cost reduction and efficiency improvement.", "BodyBee"),
    p("Evidence discipline", "H2Bee"),
    p("Public sources do not disclose Comvita's private case-level release cycle time, broker rework rate, or evidence-defect rate. Accordingly, this document separates three layers: (1) facts disclosed by Comvita and New Zealand authorities; (2) operational pain logically implied by those facts and the company's business model; and (3) BeeTrust prototype measures and proposed pilot targets. Prototype targets are not historical Comvita results and must be validated with authorised Comvita telemetry.", "WarningCallout"),
    table([
        head("Layer", "What is evidenced", "How it is used"),
        [cell("Public enterprise facts", True), cell("FY25/FY26 financial and operating disclosures, company structure, supply-chain model, market performance, inventory and cost indicators [1, 2]."), cell("Defines a real New Zealand enterprise context and the pressure to improve execution, working capital, and cost discipline.")],
        [cell("Regulatory and process facts", True), cell("MPI export and certification guidance, Customs tariff and export-entry requirements, TSW workflow, and MFAT exporter guidance [3-7]."), cell("Defines why release evidence must be current, destination-specific, complete, and reviewable.")],
        [cell("BeeTrust evidence", True), cell("Runnable TypeScript workflow, evidence matrix, custody hash chain, document drafts, red-team faults, and acceptance metrics [8]."), cell("Defines the solution mechanism and the measurable pilot baseline.")],
    ], [1.25 * inch, 3.08 * inch, 2.86 * inch]),
    p("Executive fit conclusion", "H1Bee"),
    p("BeeTrust is a fit as a release-desk control layer, not a replacement for Comvita's laboratory, broker, MPI certification, Customs declaration, or management approval. It creates one case, one dependency-aware plan, one evidence matrix, consistent draft documents, and a fail-closed decision boundary.", "BodyBee"),
]

story += [
    p("1. The real enterprise context", "H1Bee"),
    p("Comvita's FY25 disclosure described a difficult operating environment: revenue of NZD 192.4 million, gross profit of NZD 82.7 million, reported NPAT loss of NZD 104.8 million, inventory of NZD 89.0 million, net debt of NZD 62.4 million, and NZD 12.6 million of implemented cost reductions [2]. The same disclosure identified prolonged oversupply, pricing volatility, softer consumer demand, internal complexity, underperforming investments, and the cost of a significant turnaround. It also reported high-cost inventory provisions of NZD 15.1 million and stated that the company was simplifying the supply chain and rationalising product lines [2].", "BodyBee"),
    p("Comvita's FY26 results show a materially stronger position, but they also confirm that operating discipline remains a live management priority: revenue reached NZD 213.0 million, operating profit was NZD 14.0 million, operating cash flow was NZD 40.3 million, inventory fell from NZD 89.0 million to NZD 79.9 million, and operating expenses fell by NZD 12.2 million or 10.7 percent [1]. The FY26 announcement explicitly attributes improvement to procurement and cost management, inventory normalisation, and a more efficient cost structure, and says the company will continue to focus on supply-chain efficiency and optimising returns from existing assets [1].", "BodyBee"),
    p("The problem is therefore not that Comvita lacks evidence or process. The problem is that a global, vertically integrated, multi-market exporter must coordinate many evidence objects and decisions while protecting cash, inventory value, margin, and release speed. A small amount of preventable manual rework is economically relevant in a business that has publicly reported inventory provisions, cost-reduction programmes, balance-sheet strengthening, and disciplined capital allocation.", "Callout"),
    p("Company reality that BeeTrust can address", "H2Bee"),
    table([
        head("Publicly disclosed reality", "Enterprise implication", "BeeTrust fit"),
        [cell("Vertical integration from New Zealand forests and beehives to international omni-channel distribution [1].", True), cell("A release case needs a consistent identity across origin, processing, warehouse, carrier, and destination evidence."), cell("custody-ledger links each hand-off; orchestration-hub gives every case one ID; evidence-monitor checks the whole bundle.")],
        [cell("Operations span New Zealand, Australia, Greater China, North America, Japan, Korea, and Southeast Asia [1].", True), cell("Market-access evidence, documentation, and commercial assumptions are not interchangeable between destinations."), cell("mpi-market-access resolves a versioned destination rule; customs-clearance preserves source snapshots and assumptions.")],
        [cell("The company runs an accredited laboratory and verifies bee-product ingredients [1, 2].", True), cell("Laboratory evidence is valuable but must be associated with the right batch and retained with the release case."), cell("fingerprint-evidence provides deterministic triage and evidence references; it does not replace accredited testing.")],
        [cell("FY25 reported high-cost inventory provisions and supply-chain simplification; FY26 reported inventory normalisation and continued supply-chain-efficiency work [1, 2].", True), cell("Improved visibility of release blockers and document readiness can protect working capital and reduce avoidable delay, but cannot by itself forecast demand or change commodity prices."), cell("The monitor makes missing evidence, blocked gates, and next actions visible before a release decision.")],
    ], [2.15 * inch, 2.28 * inch, 2.76 * inch]),
    p("What BeeTrust is not claiming", "H2Bee"),
    p("BeeTrust does not claim that its prototype caused Comvita's FY26 financial improvement. It does not claim to cure inventory oversupply, market-price pressure, consumer demand, or harvest variability. Its contribution is narrower and measurable: automate and audit the evidence-coordination work that sits between an export intent and a broker-review release recommendation. The pilot must test whether that work is material in Comvita's actual operating environment.", "BodyBee"),
]

story += [
    p("2. Enterprise pain point A: batch identity, quality, and traceability", "H1Bee"),
    p("Comvita's model combines independent New Zealand beekeepers with company-owned apiaries, export processing, quality verification, and international distribution [1, 3]. The company's public guidance explains that honey for export must be linked to an MPI-registered Risk Management Programme facility, or to the applicable registered-apiarist and harvest-statement path; it also explains that the UMF system verifies four chemical markers and that country-specific packaging and authenticity features matter [3].", "BodyBee"),
    p("The practical pain is the join between those records. A laboratory result can be valid but attached to the wrong batch; a custody event can be complete but carry a changed batch ID; a product can meet a quality threshold but lack the destination evidence needed for release. The work is not just storing documents. It is proving that the quality, origin, custody, and market-access evidence refer to the same commercial unit.", "BodyBee"),
    table([
        head("Pain mechanism", "Cost or efficiency effect", "BeeTrust response", "Proposed measure"),
        [cell("Manual reconciliation across beekeeper, RMP, laboratory, processor, warehouse, and carrier records.", True), cell("Repeated checking and re-keying; late discovery of missing links; slower broker packet preparation."), cell("One TradeCase with structured evidenceRefs; custody-ledger creates previousHash, hash, and headHash for the ordered events."), cell("Median reconciliation minutes per eligible case; target 50 percent reduction from measured baseline.")],
        [cell("Quality result and batch identity can diverge.", True), cell("Wrong-batch risk and expensive re-sampling or investigation."), cell("fingerprint-evidence returns batch-specific similarity, confidence, anomalies, and a stable evidence reference; custody verifies batch IDs."), cell("Supported mismatch and tamper faults detected at least 95 percent of the time in pilot.")],
        [cell("Evidence may exist but be hard to prove during review.", True), cell("Audit preparation becomes a search exercise and creates avoidable rework."), cell("evidence-monitor requires evidence references for every passing gate and lists missing evidence and next actions."), cell("At least 98 percent of pilot cases have complete evidence references before reviewer hand-off.")],
    ], [1.7 * inch, 1.78 * inch, 2.08 * inch, 1.63 * inch]),
    p("How this solves the pain", "H2Bee"),
    bullet("The custody ledger turns a flat list of events into a tamper-evident chain that a reviewer can verify independently.") ,
    bullet("The fingerprint Skill makes a deterministic comparison visible and labels the prototype as triage support rather than an accredited laboratory result.") ,
    bullet("The final evidence matrix prevents a strong laboratory result from masking a missing custody or market-access record.") ,
    p("Business value boundary", "H2Bee"),
    p("The value is avoided rework and earlier detection of inconsistent evidence. It is not a claim that hashing proves physical custody, replaces a chain-of-custody SOP, or creates legal title. Comvita's authorised quality and logistics teams would remain accountable for the underlying records and release decision.", "BodyBee"),
    p("3. Enterprise pain point B: destination-specific export release and broker hand-off", "H1Bee"),
    p("New Zealand exporters must use current destination and commodity requirements. MPI provides steps and requirements for exporting honey and bee products and explains export certification pathways [3, 4]. New Zealand Customs requires accurate and complete export declarations, current tariff classification and rates, and electronic clearance through the relevant process [5, 6]. TSW is the electronic channel for submitting Customs and other government-agency lodgements [6]. MFAT also advises exporters to check tariff rates, rules of origin, documentation, and other requirements for the relevant agreement and to revisit them when conditions change [7].", "BodyBee"),
    p("For a company operating across several geographies, the pain is not a lack of regulations. It is the recurring hand-off from commercial intent to a complete, current, destination-specific evidence package. A broker needs a consistent quantity, product description, classification candidate, values, certificates, and source trail. When these are assembled manually, the same data may be entered more than once and a stale or missing source may be discovered at the end of the process.", "BodyBee"),
    table([
        head("Release pain", "BeeTrust control", "Expected enterprise effect"),
        [cell("Destination evidence is incomplete, stale, or mapped to a different rule version.", True), cell("mpi-market-access uses a versioned rule snapshot, freshness check, mandatory evidence list, and fail-closed logic."), cell("Earlier exception handling and less late-stage rework; pilot target: 25 percent reduction in evidence rework events.")],
        [cell("Classification, rates, freight, insurance, and invoice data are assembled repeatedly.", True), cell("customs-clearance reuses case data, produces transparent estimates, records assumptions, and drafts the invoice, packing list, and TSW object."), cell("Less manual preparation; pilot target: 60 percent reduction in document-preparation minutes for the selected workflow.")],
        [cell("A live public source is unavailable or changes unexpectedly.", True), cell("The live source is hashed and retained; unavailable or unverifiable content becomes REVIEW with a manual action."), cell("No false confidence from an outage; target: 100 percent of REVIEW results carry a specific next action.")],
    ], [1.95 * inch, 2.55 * inch, 2.7 * inch]),
]

story += [
    p("4. Enterprise pain point C: working-capital and operating-discipline pressure", "H1Bee"),
    p("Comvita's public disclosures make the financial context unusually concrete. FY25 reported a NZD 15.1 million inventory provision, NZD 12.6 million of implemented cost reductions, a NZD 24 million working-capital facility after renegotiation, and the need for a longer-term recapitalisation solution [2]. FY26 then reported a NZD 11.9 million cash inflow from inventory reduction, a fall in inventory from NZD 89.0 million to NZD 79.9 million, operating expenses down NZD 12.2 million, and a continued focus on capital discipline and supply-chain efficiency [1].", "BodyBee"),
    p("These figures do not prove that export evidence rework caused the inventory provision or financing pressure. They do establish why Comvita has a real business reason to remove avoidable process cost and improve decision visibility. BeeTrust addresses the controllable administrative layer: it makes release blockers visible, avoids repeated document assembly, and preserves an evidence trail so that operators can resolve exceptions before a shipment waits on an incomplete packet.", "Callout"),
    p("Quantified cost-reduction logic", "H2Bee"),
    p("The prototype currently exposes a transparent comparison between a 108-minute manual coordination estimate and a 32-minute orchestrated estimate for the supported case. This is a fixture-based time-reduction proxy, not a Comvita observation. It implies 76 minutes or 1.267 hours of capacity per eligible case. The pilot should replace the proxy with observed time stamps and use the following calculation:", "BodyBee"),
    code("Annual labour-capacity value = eligible cases per year\n                         x (baseline minutes - BeeTrust minutes) / 60\n                         x blended NZD labour cost per hour"),
    p("Same-scope percentage, not a company-wide comparison: for 250 eligible cases, baseline coordination is 250 x 108/60 = 450 hours, or NZD 24,750 at NZD 55 per hour. BeeTrust reduces this to 250 x 32/60 = 133 hours, releasing NZD 17,417 of capacity. The like-for-like process improvement is therefore 70.4%. This is a pilot capacity signal, not realised cash saving; it excludes implementation cost, training, integration, review, and non-labour benefits. Any financial claim requires Comvita-approved volume and labour-rate data.", "WarningCallout"),
    p("What improves operationally", "H2Bee"),
    table([
        head("Indicator", "Public company context", "BeeTrust prototype / pilot target", "Measurement method"),
        [cell("Operating cost discipline", True), cell("FY25: NZD 12.6m cost reductions; FY26: operating expenses down NZD 12.2m or 10.7% [1, 2]."), cell("Target: reduce release-desk coordination minutes by at least 50% from a measured baseline; prototype proxy is 108 to 32 minutes."), cell("Case-level timestamps from intent received to reviewer-ready evidence pack; report median and p90.")],
        [cell("Inventory and cash sensitivity", True), cell("FY25 inventory NZD 89.0m; FY26 NZD 79.9m; FY26 inventory reduction generated NZD 11.9m cash inflow [1, 2]."), cell("Target: reduce release holds caused by missing evidence by 25%; do not attribute inventory reduction to BeeTrust without a controlled study."), cell("Count and duration of evidence-related holds; compare pilot cohort with matched prior-period cases.")],
        [cell("Document preparation", True), cell("Public disclosures identify procurement, cost management, and supply-chain efficiency as continuing priorities [1]."), cell("Target: 60% lower preparation time and at least 90% of pilot packets produced without duplicate data entry."), cell("Timed task study plus field-level comparison of drafts and final broker documents.")],
        [cell("Exception detection", True), cell("Multi-market operations and current MPI/Customs requirements make stale or inconsistent evidence a practical risk [3-7]."), cell("Target: >=95% detection of supported faults; 100% of blocked/review results include next actions."), cell("Adversarial replay and sampled real-case mutation tests; record false negatives and false positives.")],
    ], [1.32 * inch, 2.12 * inch, 2.15 * inch, 1.62 * inch]),
    p("Strategic fit", "H2Bee"),
    p("A tool that shortens release coordination and makes evidence exceptions visible supports Comvita's public priorities of cost management, inventory normalisation, procurement discipline, operating-model improvement, and supply-chain efficiency [1, 2]. It is deliberately narrow enough to pilot without claiming to solve market demand, pricing, or harvest risk.", "BodyBee"),
]

story += [
    p("5. BeeTrust solution mapping", "H1Bee"),
    p("BeeTrust maps one commercial case to the operational sequence already required by the export decision. The supported demo contract is: Release 1000 jars of UMF Manuka honey from New Zealand to Australia for Australian retail review. The same architecture can be evaluated against Comvita's authorised workflow after the product and destination data are approved.", "BodyBee"),
    code("trade intent\n  -> orchestration-hub: parse, plan, dispatch\n  -> [fingerprint-evidence | custody-ledger | mpi-market-access]\n  -> customs-clearance: classify, estimate, draft\n  -> trade-risk-adversary: replay controlled faults\n  -> evidence-monitor: RELEASE, REVIEW, or BLOCKED"),
    table([
        head("BeeTrust capability", "Enterprise work replaced or controlled", "Output retained for review", "Why it matters to Comvita"),
        [cell("orchestration-hub", True), cell("Manual sequencing and status chasing."), cell("DAG, lifecycle messages, attempts, dependency order."), cell("One case and one execution trace across global operations and support teams.")],
        [cell("fingerprint-evidence", True), cell("Manual marker normalisation and first-pass comparison."), cell("Similarity, confidence, anomalies, and lab evidence reference."), cell("Faster, explicit triage while preserving accredited laboratory authority.")],
        [cell("custody-ledger", True), cell("Flat event-list reconciliation across hand-offs."), cell("previousHash, hash, headHash, tamperedEventIds."), cell("Stronger batch identity evidence before a release recommendation.")],
        [cell("mpi-market-access", True), cell("Destination requirement lookup and completeness checking."), cell("Versioned rule, checks, missing evidence, source URLs."), cell("Reduces stale-rule and incomplete-packet risk for multi-market export.")],
        [cell("customs-clearance", True), cell("Repeated classification, value calculation, and document drafting."), cell("HS candidates, totals, assumptions, invoice, packing list, TSW draft."), cell("Reduces repetitive preparation without taking broker or Customs authority.")],
        [cell("trade-risk-adversary", True), cell("Confidence based only on a clean demo."), cell("Six controlled findings and blocked gate."), cell("Tests resilience against the kind of field disagreement that creates late incidents.")],
        [cell("evidence-monitor", True), cell("Human reconciliation of several partial results."), cell("Five-gate matrix, score, decision, reasons, next actions."), cell("Creates one defensible release-to-broker-review boundary.")],
    ], [1.35 * inch, 2.05 * inch, 1.8 * inch, 2.0 * inch]),
    p("Commercial process change", "H2Bee"),
    table([
        head("Before pilot", "With BeeTrust", "Expected effect"),
        [cell("A coordinator collects laboratory, custody, MPI, and Customs information from separate channels."), cell("The coordinator submits one intent and receives a plan, evidence matrix, drafts, and explicit exceptions."), cell("Lower search and coordination time; easier onboarding and hand-over.")],
        [cell("A clean-looking release can hide missing evidence or an untested mutation."), cell("Evidence-monitor is fail-closed and trade-risk-adversary tests six supported faults on a clone."), cell("Higher defect visibility before broker or customer impact.")],
        [cell("A source change is discovered after the packet is assembled."), cell("Rule version, freshness, source URLs, and source hashes remain attached to the case."), cell("More reproducible review and faster source refresh.")],
        [cell("Documents are keyed in more than once and corrections are hard to count."), cell("Shared case data creates invoice, packing list, and TSW drafts with assumptions listed."), cell("Fewer duplicate-entry errors; measurable reduction in preparation minutes.")],
    ], [2.15 * inch, 2.62 * inch, 2.43 * inch]),
    p("Human-control boundary", "H2Bee"),
    p("The output is a release recommendation for broker review. Comvita's authorised laboratory, quality, export, broker, Customs, and management roles remain responsible for verifying underlying records, approving documents, submitting any official lodgement, and making the final commercial release decision. This boundary is essential for a credible enterprise pilot.", "BodyBee"),
]

story += [
    p("6. Pilot design and quantified success criteria", "H1Bee"),
    p("The proposed pilot should run on an authorised sample of real release cases, with a matched pre-pilot baseline. The prototype's supported Australia fixture is suitable for demonstration and technical validation, but it is not sufficient to establish Comvita's actual savings. A pilot should begin with one product family, one destination lane, and the existing human review process, then compare the current workflow with BeeTrust-assisted workflow.", "BodyBee"),
    p("Pilot scope", "H2Bee"),
    bullet("Case type: one authorised Manuka honey export lane with current MPI and Customs evidence requirements.") ,
    bullet("Cohort: at least 25 eligible cases or four to six weeks of normal operations, whichever is later; record volume rather than assuming it.") ,
    bullet("Roles: export coordinator, quality/laboratory reviewer, broker, logistics or warehouse representative, and one accountable approver.") ,
    bullet("Data: timestamps, evidence references, document versions, rework events, holds, exceptions, and final decision. Do not load unauthorised personal or commercially sensitive data.") ,
    p("Acceptance scorecard", "H2Bee"),
    table([
        head("Metric", "Baseline", "Target", "Pass rule and evidence"),
        [cell("Release coordination time", True), cell("Measured for current process during pre-pilot."), cell(">=50% reduction in median minutes; prototype proxy is 108 to 32 minutes, a 70% reduction."), cell("Pass if time stamps show target for the agreed cohort and p90 does not materially worsen.")],
        [cell("Evidence rework rate", True), cell("Cases requiring a second request, correction, or repeated search."), cell(">=25% reduction from matched baseline."), cell("Pass if rework events are logged by reason and the reduction is not offset by unresolved holds.")],
        [cell("Reviewer-ready packet completeness", True), cell("Baseline percentage with all required references before review."), cell(">=98% complete evidence references; >=90% packet generation without duplicate entry."), cell("Pass if sampled packets can be reconstructed from the case ID and retained references.")],
        [cell("Supported fault detection", True), cell("Pre-pilot test of known mutations."), cell(">=95% detection; prototype baseline is six of six supported faults blocked."), cell("Pass if every false negative is investigated and no baseline case is mutated.")],
        [cell("Decision quality", True), cell("Human decision and reason coding."), cell("100% of REVIEW and BLOCKED results have a concrete next action; zero silent release on missing mandatory evidence."), cell("Pass from evidence-monitor logs and approver sample.")],
        [cell("Capacity value", True), cell("Approved blended NZD labour rate and eligible case volume."), cell("Calculate only after time target passes; report capacity value separately from cash saving."), cell("Pass if formula inputs are approved and auditable; do not report as realised saving without finance sign-off.")],
    ], [1.5 * inch, 1.77 * inch, 1.88 * inch, 2.05 * inch]),
    p("Measurement plan", "H2Bee"),
    code("For each case, capture:\nreceivedAt -> planCreatedAt -> rootChecksCompleteAt\n-> draftsReadyAt -> reviewReadyAt -> finalDecisionAt\n\nAlso capture:\nreworkCount, holdMinutes, missingEvidenceCount,\nmanualEntryCorrections, faultDetected, reviewerOutcome"),
    p("Report median, p90, and case count. Stratify by destination, product grade, and exception type. Compare like-for-like cases and do not convert reduced cycle time into a financial saving unless the responsible finance owner approves the labour rate, volume, and cost-allocation assumptions.", "BodyBee"),
    p("Go / no-go decision", "H2Bee"),
    table([
        head("Decision", "Condition"),
        [cell("Proceed to controlled expansion", True), cell("Time, completeness, and detection targets pass; no critical false negative; broker and quality reviewers accept the evidence boundary.")],
        [cell("Continue pilot with controls", True), cell("Efficiency improves but a target is missed, data coverage is weak, or a workflow integration needs adjustment. Keep human approval mandatory.")],
        [cell("Stop and remediate", True), cell("A supported fault is missed, a case is released with missing mandatory evidence, or source/version handling cannot be reconstructed.")],
    ], [2.15 * inch, 5.05 * inch]),
]

story += [
    p("7. Risks, limitations, and recommendation", "H1Bee"),
    p("The enterprise fit is strong because the pain points are public, specific, and operationally adjacent to BeeTrust's existing design. The implementation should nevertheless be positioned as a controlled release-desk accelerator rather than an autonomous trade-compliance agent.", "BodyBee"),
    table([
        head("Risk or limitation", "Control in this proposal"),
        [cell("Prototype fixture is not Comvita production data.", True), cell("Use public facts for fit only; validate every target with authorised case telemetry and an agreed baseline.")],
        [cell("Regulations, tariff rates, and destination rules change.", True), cell("Retain source URL, retrieval date, rule version, source hash, and manual refresh owner; revalidate before production use [3-7].")],
        [cell("A hash chain does not prove that physical events happened.", True), cell("Treat it as evidence-integrity support; retain source records, role approvals, and operational controls.")],
        [cell("A candidate HS code is not a legal classification.", True), cell("Use customs-clearance output as a draft; require broker or Customs confirmation before official submission [5, 6].")],
        [cell("Quantified savings can be overstated.", True), cell("Report time reduction, capacity value, and realised cost saving as separate metrics with finance-approved assumptions.")],
        [cell("Automation could obscure a missing source.", True), cell("evidence-monitor fails closed on missing evidence and emits a next action; REVIEW remains human-owned.")],
    ], [2.15 * inch, 5.05 * inch]),
    p("Recommendation", "H1Bee"),
    p("Approve a narrow Comvita discovery pilot for one New Zealand-to-Australia Manuka honey lane. Decide from measured coordination time, evidence rework, packet completeness, supported fault detection, and finance-approved capacity value; expand only if the controls pass.", "Callout"),
    PageBreak(),
    p("References", "H1Bee"),
    p("APA 7th edition format. Numbered citations in the body correspond to the entries below. Web sources were accessed September 26, 2026. Dynamic regulatory, tariff, and company-investor pages should be revalidated before production use.", "SmallMuted"),
    reference("[1] Comvita Limited. (2026, August 28). <i>Comvita returns to profit in FY26</i> [Market announcement]. https://comvita.co.nz/cdn/shop/files/Comvita_returns_to_profit_in_FY26.pdf?v=18330648786878608775"),
    reference("[2] Comvita Limited. (2025, August 29). <i>Comvita Limited releases results for the year ended 30 June 2025</i> [Market announcement]. https://comvita.co.nz/cdn/shop/files/Comvita_releases_FY25_results.pdf?v=4424674406614309189"),
    reference("[3] Comvita Limited. (n.d.). <i>FAQs</i>. Retrieved September 26, 2026, from https://comvita.co.nz/pages/faqs"),
    reference("[4] New Zealand Ministry for Primary Industries. (n.d.-a). <i>Steps to exporting honey and bee products</i>. Retrieved September 26, 2026, from https://www.mpi.govt.nz/export/food/honey-and-bee-products/steps-to-exporting"),
    reference("[5] New Zealand Ministry for Primary Industries. (n.d.-b). <i>Honey and bee products: Requirements</i>. Retrieved September 26, 2026, from https://www.mpi.govt.nz/export/food/honey-and-bee-products/requirements"),
    reference("[6] New Zealand Ministry for Primary Industries. (n.d.-c). <i>Animal product export certificates</i>. Retrieved September 26, 2026, from https://www.mpi.govt.nz/export/export-requirements/export-certification/animal-product-export-certificates"),
    reference("[7] New Zealand Customs Service. (n.d.-a). <i>Tariff classifications and rates</i>. Retrieved September 26, 2026, from https://www.customs.govt.nz/business/tariffs/tariff-classifications-and-rates"),
    reference("[8] New Zealand Customs Service. (n.d.-b). <i>Clear your exports</i>. Retrieved September 26, 2026, from https://www.customs.govt.nz/business/export/clear-your-exports"),
    reference("[9] New Zealand Customs Service. (n.d.-c). <i>Getting started with Trade Single Window</i>. Retrieved September 26, 2026, from https://www.customs.govt.nz/business/trade-single-window-tsw/getting-started"),
    reference("[10] New Zealand Ministry of Foreign Affairs and Trade. (n.d.). <i>Guide to using free trade agreements for goods exporters</i>. Retrieved September 26, 2026, from https://www.mfat.govt.nz/en/trade/how-we-help-exporters/guide-to-using-free-trade-agreements-for-goods-exporters"),
    reference("[11] BeeTrust project team. (2026). <i>BeeTrust Honey Export Release Desk</i> [Computer software and source code]. Unpublished project repository."),
]


doc = SimpleDocTemplate(
    str(OUT),
    pagesize=letter,
    rightMargin=0.58 * inch,
    leftMargin=0.58 * inch,
    topMargin=0.58 * inch,
    bottomMargin=0.66 * inch,
    title="Enterprise Challenge Fit Statement",
    author="BeeTrust project team",
)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f"Wrote {OUT}")
