# BeeTrust Implementation Demo Video Script

Target duration: 4 minutes 40 seconds maximum.

Submission format: MP4, 16:9, 1080p preferred, with burned-in English subtitles. Voice is optional; this version is designed to work as a silent screen recording.

Subtitle source: `DEMO_SUBTITLES_EN.srt`. The Comvita disclosure appears at the opening, and the 70% pilot-time-proxy disclosure appears near the closing.

## 1. What this video must prove

The Judging Rubric gives the Presentation and Demo dimension 15 points:

- 5.1 Industry solution presentation: explain the real business problem, solution logic, value proposition, and business loop.
- 5.2 Demo demonstration: invoke the core Skills Package capabilities, show multi-Skill integration, and display verifiable outputs.
- 5.3 Communication: keep the explanation clear, accurate, and logically ordered.

The rubric also states that a live link is preferred, while an MP4 of no more than five minutes is recommended as backup evidence. Do not present this prototype as a live Comvita shipment, a government certificate, or measured historical savings.

## 2. Business framing to state on screen

Use this disclosure in the opening slide or subtitle:

> Representative enterprise scenario based on public materials about Comvita Limited. The shipment and records are synthetic demonstrator fixtures; the package does not claim access to Comvita private SOPs, customer data, or shipment records.

The real business problem is:

> A New Zealand honey exporter and broker must decide whether a batch can be released to an Australian retail channel. Laboratory authenticity, chain of custody, MPI market access, customs documents, and adversarial exceptions are often checked across separate hand-offs. If a missing document, inconsistent batch identity, or destination-rule conflict is found late, release can be delayed and rework can increase.

BeeTrust solves this as an auditable decision workflow. It runs independent evidence checks in parallel, waits for dependency gates, prepares customs drafts, replays controlled faults, and gives a final RELEASE, REVIEW, or BLOCKED decision with evidence references.

## 3. Recording setup

Use two visible windows:

1. Browser: `apps/web/dist/beetrust-dashboard.html`.
2. PowerShell terminal in `apps/web`.

Before recording:

```powershell
cd apps/web
npm run demo:live
```

Open the generated dashboard path printed by the command. Use a large terminal font and hide personal notifications, tokens, unrelated tabs, and local usernames.

The supported prompt is exactly:

```text
Release 1000 jars of UMF Mānuka honey from New Zealand to Australia for AU retail review.
```

Do not use unsupported Shanghai or MGO 550+ examples.

## 4. Timeline and screen actions

### 0:00-0:30 - Business problem and target outcome

Show the dashboard title, route, 1,000-jar case, and the representative-enterprise disclosure. Burn in the English text below as two-line subtitles; keep each caption on screen long enough to read.

Subtitle:

> BeeTrust is an evidence-backed release desk for a New Zealand Mānuka honey exporter and broker. The business problem is not simply checking one laboratory result. Before a batch can move to Australian retail review, the operator must reconcile scientific evidence, custody history, New Zealand market-access rules, customs preparation, and exception risk. BeeTrust turns these hand-offs into one auditable release decision. This is a synthetic demonstrator based on public enterprise materials, not a claim about a real Comvita shipment.

### 0:30-0:55 - Input and orchestration

Show the exact supported prompt and the dashboard execution sequence. Run Scenario A.

Subtitle:

> The orchestration hub parses the shipment intent and creates a dependency-aware DAG. The three independent root Skills start in parallel: fingerprint-evidence, custody-ledger, and mpi-market-access. The workflow uses SkillMessage/v1 so every hand-off has a skill, status, attempt, payload, and evidence references.

### 0:55-1:35 - Three parallel evidence Skills

Click the three Skill cards after they complete.

Subtitle:

> Fingerprint-evidence compares the laboratory marker vector with a versioned reference profile and checks similarity, confidence, and anomalies. Custody-ledger canonicalises the farm, processor, warehouse, and carrier events into a SHA-256 chain. I can verify each previousHash, each new hash, and the final headHash. MPI market access checks the destination rule snapshot, RMP, OMAR, export certificate, trade certification, freshness, and rule-version consistency.

Show the custody detail panel with `previousHash`, `hash`, and `headHash` visible if possible.

### 1:35-2:10 - Sequential release preparation

Show that all three roots complete before the next stages begin.

Subtitle:

> The dependency barrier now allows customs-clearance to run. It proposes the honey HS candidate, prepares commercial invoice and packing-list drafts, and produces a transparent landed-value estimate without submitting anything to TSW. Next, trade-risk-adversary checks the clean baseline and prepares the controlled negative-path replay. Finally, evidence-monitor evaluates five release gates from the evidence matrix rather than trusting an unverified pass message.

Click the customs card and show the HS candidate, document drafts, and landed value. The value is a case-supplied estimate, not a quote or duty ruling.

### 2:10-2:35 - Verifiable happy-path result

Show the green decision badge, five gates, runtime timeline, and terminal output.

Subtitle:

> The baseline result is RELEASE with a score of 100 out of 100. All five release gates have evidence references, the next action is broker review with the evidence bundle, and the runtime executed through the LangGraph StateGraph adapter. The current fixture reports 100 percent evidence coverage and 12 SkillMessage/v1 runtime events.

### 2:35-3:35 - Red-team fault injection

Switch to Scenario B. Select `batch-id-tamper` or `fingerprint-mismatch`. Do not randomly edit source files during the recording.

Subtitle:

> A release workflow also needs to fail safely. The red-team Skill clones the baseline case and injects one controlled fault. I will use batch-ID tampering. The original case is not mutated in place. The timeline shows the fault injection, cloned case creation, downstream checks, evidence-monitor blocking, release halt, and baseline preservation.

Point to the visible sequence:

```text
RED_TEAM_FAULT_INJECTED
MUTATED_CASE_CREATED
DOWNSTREAM_CHECK_STARTED
EVIDENCE_MONITOR_BLOCKED
RELEASE_HALTED
BASELINE_PRESERVED
```

Subtitle:

> The mutated case is BLOCKED because the custody identity no longer agrees with the case. This is a substantive business control: it prevents an apparently successful baseline from being overwritten by an exception. The original baseline remains RELEASE.

### 3:35-4:05 - Invalid input and boundary coverage

Show the acceptance report or terminal output after recording the main flow. If time allows, show one negative fixture rather than replaying all three.

Subtitle:

> The package also fails closed for malformed laboratory data, unsupported destination rules, and invalid customs input. It does not invent evidence or silently continue. The acceptance suite verifies three blocked fallback branches, 33 trigger fixtures with no negative false positives, and 198 passing self-test cases across the seven Skills.

### 4:05-4:40 - Business loop and closing value

Show both final states side by side if possible: baseline `RELEASE`, injected case `BLOCKED`, and `Baseline preserved: true`.

Subtitle:

> BeeTrust closes the business loop from shipment intent to broker-ready release recommendation: collect evidence, verify custody, check destination rules, prepare customs documents, stress-test exceptions, and monitor the final gates. In this deterministic fixture, evidence coverage is 100 percent, all six controlled red-team faults are blocked, and three root agents run in parallel. The 70 percent time figure is labelled a pilot time proxy based on the fixture’s hand-offs, not a measured enterprise saving. The next production step would be to replace the fixtures with accredited laboratory records, current destination rules, and broker-confirmed tariff data.

## 5. Capture checklist

Make sure the recording visibly contains:

- the exact New Zealand-to-Australia business scenario;
- the representative-enterprise and synthetic-fixture disclosure;
- orchestration-hub DAG creation;
- three parallel root Skills;
- `SkillMessage/v1` lifecycle events;
- custody `previousHash`, `hash`, and `headHash`;
- MPI market-access result;
- customs HS candidate, document drafts, and estimate;
- five evidence-monitor release gates;
- baseline `RELEASE`;
- one controlled red-team case showing `BLOCKED`;
- `BASELINE_PRESERVED`;
- at least one invalid-input fail-closed result;
- 7 Skills, 198 self-tests, and 100% evidence/fault-detection fixture metrics.

## 6. Accuracy and safety rules

- Say “representative enterprise scenario” and “synthetic fixture”; do not say Comvita approved or supplied the shipment.
- Say “decision support” and “draft”; do not say BeeTrust issues MPI certificates, customs clearances, or legal determinations.
- Say “pilot time proxy” for the 70% estimate; do not present it as measured ROI.
- Do not show personal data, credentials, API keys, private URLs, or unredacted local paths.
- Keep the final MP4 under five minutes and verify that every caption, output label, and final decision is readable without audio.
- Use at most two subtitle lines, 32-40 px text at 1080p, high-contrast white text with a dark translucent background.
- Never place subtitles over the decision badge, hash values, or release-gate table; move them to the lower safe area.

## 7. Optional FFmpeg fallback

If OBS is unavailable, record the desktop with the installed FFmpeg fallback:

```powershell
ffmpeg -f gdigrab -framerate 30 -draw_mouse 1 -i desktop -c:v libx264 -preset veryfast -pix_fmt yuv420p -t 00:04:40 BeeTrust-implementation-demo.mp4
```

After recording, burn in the English subtitles:

```powershell
ffmpeg -i BeeTrust-implementation-demo.mp4 -vf "subtitles=DEMO_SUBTITLES_EN.srt:force_style='FontName=Arial,FontSize=28,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,MarginV=54'" -c:a copy BeeTrust-implementation-demo-subtitled.mp4
```

Use the screen recording only; no voice track is required. Review the final MP4 once from start to finish with audio muted before uploading it.
