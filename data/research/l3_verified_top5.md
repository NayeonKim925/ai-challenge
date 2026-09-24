# L3 Verified Top-5 — STEP 2 Verification Pass

Generated: 2026-09-24
Base: re-verifies the 5 candidates STEP 1 flagged as the strongest Grade-A material
(`L3-001`, `L3-004`, `L3-005`, `L3-006`, `L3-008` in
[`l3_candidates.json`](./l3_candidates.json)). That file and `l3_candidates.md` were
**not modified** — this is a separate, additive verification layer. Full detail (all
source URLs, exact OBSERVED/INFERRED status per field, full discrepancy text) is in
[`l3_verified_top5.json`](./l3_verified_top5.json); this file is a quick-scan summary.

## A note on method

Direct `WebFetch` of every STEP 1 primary source (cnn.com, bloomberg.com,
constructiondive.com, enr.com, semafor.com, renesas.com) failed with
`EGRESS_BLOCKED` — this session's network policy blocks those domains for direct
page fetch. Verification was instead done by running several additional,
independently-worded searches per case to surface outlets STEP 1 hadn't used yet
(e.g. Austin American-Statesman's 5-part 2021 series on the Samsung storm case,
Onondaga County local news for Micron, Georgia's own state press release + a
facility-address listing for the Hyundai-LG case, AJC/ConstructConnect/Rivian's own
newsroom for Rivian, Bloomberg/DataCenterDynamics/Embedded Computing Design for
Renesas) and cross-checking facts across at least 2 independent outlets per case.
This is still search-summary-based rather than raw full-article reads, which is
disclosed per the task's own rule against confirming facts from a single snippet —
but every fact below is corroborated across multiple independently-worded queries
and independent outlets, not accepted from one source alone.

## Verified cases

| Case | Project | STEP 1 Grade | **Verified Grade** | Delay figure (OBSERVED) | Response (OBSERVED) |
| --- | --- | --- | --- | --- | --- |
| V2-001 (← L3-001) | HL-GA battery plant (Hyundai + LG, Georgia, ICE raid) | A | **A** | 2-3 months (CEO's own quote, 2025-09-11) | Continued $2.7B expansion investment; plant opened Apr 2026 |
| V2-002 (← L3-004) | Micron Clay, NY megafab | A | **A** | 2-3 years (Fab 1: mid/late-2028 → 2030) | Site clearing continues while foundation work is postponed to Q2 2026 |
| V2-003 (← L3-005) | Samsung Austin fab, Texas Winter Storm Uri | A | **A** | ~6 weeks to "close to normal" (Samsung statement, 2021-03-30); full normalization within Q2 2021 | Phased inspection/reconfiguration/restart |
| V2-004 (← L3-006) | Rivian Georgia EV plant | A | **B (downgraded)** | Not verified as a single figure — 5+ overlapping, imprecisely-dated milestones (pause → loan finalized → groundbreaking → site grading → vertical construction → production) | DOE loan restructured ($6.6B→"up to $4.5B"); capacity plan increased 200k→300k vehicles |
| V2-005 (← L3-008) | Renesas Naka factory fire, Japan | A | **A** | 29 days to partial (10%) restart; 97 days to 100% recovery; ~18 weeks to shipment normalization | 10-part official public disclosure series + expedited equipment replacement |

## Grade changes vs. STEP 1

**1 of 5 cases changed grade:** **L3-006 (Rivian Georgia), A → B.**
STEP 1 treated this as a clean "paused March 2024, restarted September 2025" story.
Deeper verification found the real sequence has at least five separate,
imprecisely-dated milestones (pause → a $6.6B DOE loan finalized Jan 2025, before any
visible restart → a ceremonial "groundbreaking" Sept 16, 2025 → site
grading/utilities work → "vertical construction" not expected to start until 2026 →
production targeted late 2028), plus a loan amount that is reported inconsistently
over time ($6.6B vs. later "up to $4.5B"). No source states one authoritative delay
figure the way the other four cases do, so it no longer meets the Grade A bar and is
demoted to B, per the task's rule to re-judge rather than defend the STEP 1 grade.

The other 4 cases (Hyundai/LG raid, Micron, Samsung storm, Renesas fire) all held at
Grade A under closer scrutiny — each has a numeric delay figure directly attributed
to a named source (a CEO quote, a county official + official EIS document, a company
spokesperson statement, or a company's own sequential public disclosures) and is
corroborated across multiple independent outlets.

## Key discrepancies surfaced during verification (not present in STEP 1)

- **Hyundai/LG (V2-001):** sources disagree on the plant's *original* pre-raid target
  date — "early 2026" in one source vs. "second half of 2025" in another — which
  changes the implied total delay considerably even though the CEO's own "2-3 months"
  quote is not in dispute. Also, one source misstates the plant's county (Bartow vs.
  the verified Bryan County), likely conflating it with a separate, unrelated
  Hyundai–SK On battery joint venture that genuinely is in Bartow County.
- **Micron (V2-002):** the 2-3 year delay figure verified here is actually the
  *second* of two separate delay announcements (a smaller one in June 2025, then the
  larger EIS-based one in November 2025) — STEP 1 did not distinguish these.
- **Rivian (V2-004):** the DOE loan amount changes between reports ($6.6B → "up to
  $4.5B") with no source explaining why; and "restart" is defined differently by
  different outlets, spanning roughly a year between the ceremonial event and
  substantive construction.
- **Renesas (V2-005) and the Texas storm (V2-003)** held up cleanly under
  verification with no material conflicts found — these are the two most reliable
  cases in the set.

## `usable_metrics` counts across the 5 verified cases

| Metric | usable | partially_usable | not_usable |
| --- | --- | --- | --- |
| risk_classification | 2 | 3 | 0 |
| affected_task_retrieval | 2 | 2 | 1 |
| delay_MAE | 3 | 1 | 1 |
| evidence_retrieval | 5 | 0 | 0 |
| response_evaluation | 3 | 2 | 0 |

---
*This file and `l3_verified_top5.json` are STEP 2 outputs only. No L2/L3 final dataset
and no L1 WBS were produced in this pass, per task scope.*
