# L3 Additional Verified Candidates — STEP 2.5

Generated: 2026-09-24
Base: verifies 8 additional cases drawn from STEP 1's remaining 13 candidates (all of
[`l3_candidates.json`](./l3_candidates.json) except the 5 already covered by
[`l3_verified_top5.json`](./l3_verified_top5.json)). STEP 1 and STEP 2 files were
**not modified**. One case (V3-004) is genuinely new — it was split out of STEP 1's
`L3-017` after verification found that candidate had incorrectly merged two different
Ford plants in two different countries into one record. Full detail (all sources,
exact field-level OBSERVED/INFERRED status, full discrepancy text) is in
[`l3_verified_additional.json`](./l3_verified_additional.json); this file is a
quick-scan summary.

## Verified cases

| Case | Source | Project | Country | STEP 1 Grade | **Verified Grade** | Delay figure | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V3-001 | L3-002 | TSMC Arizona Fab 1 | USA | A | **B (↓)** | ~12 months *announced*, but disputed whether realized | Official TSMC page vs. Dec 2024 CNBC report conflict on whether the delay actually held |
| V3-002 | L3-007 | GM plants (Apr 2021 wave) | USA/Mexico | A | **A** | 1-2 weeks per plant | Confirmed part of a chronic, recurring 2021 pattern, not a one-off |
| V3-003 | L3-017 (corrected) | Ford Kansas City Assembly | USA | A | **A** | 2 weeks (May), 2wk/1wk (July) | STEP 1's L3-017 had wrongly merged this with a German plant — corrected here |
| V3-004 | **NEW** (split from L3-017) | Ford Saarlouis plant (Focus) | **Germany** | — | **A** | 32 days | STEP 1 mislabeled this event's country as USA; it's actually Germany |
| V3-005 | L3-013 | VinFast North Carolina | USA | B | **B** | Not applicable — project outcome is now *termination*, not delay | County terminated the deal and the state sued VinFast (2026) |
| V3-006 | L3-014 | CATL Debrecen, Hungary | Hungary | B | **B (↑ precision)** | ~6-8 months to trial production (not yet mass production) | First real numeric anchor found for this case |
| V3-007 | L3-009 | Intel Ohio One fabs | USA | B | **B** | ~5 years cumulative | Now confirmed via Intel's own official newsroom page |
| V3-008 | L3-011 | Ford BlueOval City | USA | B | **C (↓)** | Not applicable — EV program fully canceled Dec 2025, replaced with a different (gas truck) product | STEP 1's "2yr delay" framing is now stale/superseded |

## Additional-pass grade summary

- **Grade A: 3** (V3-002, V3-003, V3-004)
- **Grade B: 4** (V3-001, V3-005, V3-006, V3-007)
- **Grade C: 1** (V3-008)

## Cumulative totals (STEP 2 + STEP 2.5 combined, 13 verified cases)

| | STEP 2 (5 cases) | STEP 2.5 (8 cases) | **Cumulative** |
| --- | --- | --- | --- |
| Grade A | 4 | 3 | **7** |
| Grade B | 1 | 4 | **5** |
| Grade C | 0 | 1 | **1** |
| **A + B** | 5 | 7 | **12** (target: 8-12 ✓) |
| delay_MAE usable | 3 | 3 | 6 |
| delay_MAE usable + partially_usable | 4 | 5 | **9** (target: 6+ ✓) |
| affected_task_retrieval usable | 2 | 6 | 8 |
| affected_task_retrieval usable + partially_usable | 4 | 7 | **11** (target: 6+ ✓) |

All three numeric targets from the task brief are met — and met by finding *better*
primary sources on genuinely strong cases (GM, Ford x2, Intel's own newsroom, CATL's
first real numeric anchor), not by lowering the quality bar. Two cases were
downgraded (TSMC A→B, BlueOval City B→C) specifically because deeper verification
surfaced problems STEP 1 could not have known about.

## Newly discovered source conflicts (not present in STEP 1)

1. **TSMC Arizona (V3-001):** TSMC's own official webpage claims high-volume
   production "started in Q4 2024" (matching the ORIGINAL pre-delay target), while a
   dated, contemporaneous Dec 13, 2024 CNBC report describes the fab as still in
   pilot/sample-wafer production and quotes TSMC saying it was merely "dang near back
   on schedule." Unresolved — this is exactly the kind of conflict that should block
   a confident MAE figure, so `delay_MAE` is marked `not_usable` for this case.
2. **Ford Focus/Saarlouis (V3-003/V3-004):** STEP 1's L3-017 merged a Kansas City,
   Missouri (USA) shutdown with a Saarlouis, Germany shutdown under one "USA" country
   label. Ford discontinued the Focus in North America years before 2021, so a US
   "Focus plant" cannot exist — the January 2021 full-month Focus shutdown was
   entirely a German event. Corrected by splitting into two cases.
3. **GM/Ford chip shortage (V3-002/V3-003):** both companies' plants experienced
   *repeated* shutdown waves throughout 2021 (April, July, September for GM; May and
   July for Ford Kansas City) at the *same* plants — this was a chronic, recurring
   disruption, not the single isolated event STEP 1's framing implied. The specific
   dated figures used here remain accurate for their specific wave, but this
   should be considered when treating any one wave as a clean "single risk event →
   single impact" training example.
4. **VinFast (V3-005):** the project's status has moved past "delayed" to outright
   contractual termination and litigation (2026), with an active legal dispute
   between VinFast and the State of North Carolina over the very definition of
   "vertical construction activity."
5. **CATL Hungary (V3-006):** original target reported as "early 2026" (S&P Global)
   vs. "spring 2026" (a less clearly-sourced summary) — roughly consistent but not
   identical; also a risk of conflating "equipment installation complete" with "mass
   production start," two different milestones.
6. **Intel Ohio (V3-007):** some 2024-era reporting suggests an intermediate "2026"
   target existed between the original 2025 target and the widely-reported Feb 2025
   restatement to 2030 — not independently pinned to an exact announcement date here.
7. **Ford BlueOval City (V3-008):** the pre-delay original target is reported
   inconsistently (2025 in STEP 1's sourcing vs. 2026 per a newer source, WREG) —
   moot in practice, since the entire product program was canceled in December 2025.

## Cases recommended AGAINST including in the final L3 ground-truth set

- **V3-008 (Ford BlueOval City) — recommend exclude.** The underlying event is no
  longer a schedule delay; Ford canceled the electric-pickup program entirely and
  replaced it with a different vehicle type. Using this as "delay" ground truth would
  teach an evaluation pipeline the wrong lesson (a scope cancellation looks nothing
  like a schedule slip on the same task).
- **V3-001 (TSMC Arizona Fab 1) — recommend exclude from `delay_MAE` scoring
  specifically, or caveat heavily if kept.** The core numeric delay claim is
  contested by conflicting primary-source and press evidence that this pass could
  not resolve. Fine to keep for `risk_classification` / `response_evaluation`
  purposes, but not as a precise delay-days ground truth.
- **V3-005 (VinFast North Carolina) — recommend exclude from `delay_MAE` scoring
  specifically, keep for everything else.** The project outcome is termination/legal
  dispute, not a late-but-completed project, so there is no well-defined "delay in
  days" to measure against. It remains one of the richest, most real regulatory +
  contractual risk cases in the set for `risk_classification`, `affected_task_retrieval`,
  and `response_evaluation` purposes.

---
*This file and `l3_verified_additional.json` are STEP 2.5 outputs only. No final
L2/L3 dataset JSON was produced in this pass, per task scope.*
