# BeeTrust End-to-End Demo Recording Script

Target duration: 4 minutes 30 seconds maximum.

## Recording setup

Use two visible windows side by side:

1. Chrome showing `apps/web/dist/beetrust-dashboard.html`.
2. A PowerShell terminal opened in `apps/web`.

Record the full desktop at 1920x1080 or 1280x720, with the terminal font large enough to read. Start with the dashboard on the supported Australia case:

`Release 1000 jars of UMF Mānuka honey from New Zealand to Australia for AU retail review.`

Do not use the unsupported Shanghai or MGO 550+ example in the recording.

## Scene A: Happy Path (0:00-2:20)

### 0:00-0:20 — Business context

Show the BeeTrust release desk and say:

> This is a New Zealand Manuka honey export decision for Australian retail review. BeeTrust coordinates seven skills and produces an evidence-backed release decision.

### 0:20-0:45 — Create the workflow

In the terminal, run:

```powershell
npm run demo:live
```

Point to the log containing `orchestration-hub` and say:

> The orchestration hub parses the supported intent and creates the dependency-aware DAG.

### 0:45-1:20 — Parallel evidence checks

Show the three root-agent start events and the dashboard execution sequence:

- `fingerprint-evidence`
- `custody-ledger`
- `mpi-market-access`

Say:

> These three independent root agents start in parallel. The terminal shows the SkillMessage/v1 lifecycle events, while the page shows the same execution order visually.

Point to the custody logs and say:

> The custody ledger builds a tamper-evident SHA-256 chain. Each custody event carries a previousHash and a new hash, and the final headHash represents the verified chain tip.

### 1:20-1:55 — Sequential release gates

Show the completion of all three root agents, followed by:

1. `customs-clearance`
2. `trade-risk-adversary` with no injected fault
3. `evidence-monitor`

Say:

> Only after all root evidence is complete do the sequential release gates run. Customs prepares the classification and export documents, the adversary performs a clean control check, and the evidence monitor evaluates the complete evidence bundle.

### 1:55-2:20 — Release result

Show the final evidence-monitor message and the green decision badge:

> The final evidence monitor decision is RELEASE. The baseline case is now ready for broker review with its evidence references and custody headHash.

## Scene B: Red-Team Fault Injection (2:20-4:10)

### 2:20-2:40 — Fresh baseline

Reset the dashboard, then run the existing incident demo in the terminal:

```powershell
npm run demo:incident
```

Say:

> Now we start from a fresh baseline. The red team uses a supported pre-computed replay, so the original case is cloned rather than mutated in place.

### 2:40-3:25 — Fault replay

Use one catalogue entry, preferably `fingerprint-mismatch` or `batch-id-tamper`. Show these timeline labels in order:

```text
RED_TEAM_FAULT_INJECTED
MUTATED_CASE_CREATED
DOWNSTREAM_CHECK_STARTED
EVIDENCE_MONITOR_BLOCKED
RELEASE_HALTED
BASELINE_PRESERVED
```

Say:

> The red team changes one controlled fact in the cloned case. The downstream checks consume the mutated evidence, and the evidence monitor blocks the release when the fingerprint or custody evidence no longer agrees.

### 3:25-4:10 — Explain the block

Point to the terminal output for `SkillMessage/v1`, the custody hashes, and the final decision:

> This is not a front-end color change. The SkillMessage/v1 result carries the failing evidence, the hash-chain verification exposes the inconsistency, and the evidence monitor emits BLOCKED. The original baseline remains unchanged and still evaluates to RELEASE.

## Closing (4:10-4:30)

Show both final outcomes if possible:

```text
Scenario A: RELEASE
Scenario B: BLOCKED
Baseline preserved: true
```

Say:

> BeeTrust turns a multi-department export decision into an auditable workflow: parallel evidence collection, sequential release gates, cryptographic custody verification, and controlled red-team containment.

## Terminal evidence checklist

Keep the terminal visible long enough to capture:

- `SkillMessage/v1`
- orchestration-hub DAG creation
- every agent `TASK_STARTED` and `TASK_COMPLETED` event
- custody `previousHash`
- custody `hash`
- final custody `headHash`
- evidence-monitor final `RELEASE` in Scenario A
- evidence-monitor final `BLOCKED` in Scenario B
- baseline preservation result

## FFmpeg fallback

If OBS is unavailable, FFmpeg is installed on this machine. Run this from a second PowerShell window after arranging the dashboard and terminal:

```powershell
ffmpeg -f gdigrab -framerate 30 -draw_mouse 1 -i desktop -c:v libx264 -preset veryfast -pix_fmt yuv420p -t 00:04:30 BeeTrust-demo.mp4
```

Press `q` only if you need to stop early. The command writes `BeeTrust-demo.mp4` in the current directory.

