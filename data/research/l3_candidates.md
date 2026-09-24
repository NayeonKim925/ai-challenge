# L3 Ground-Truth Candidates — STEP 1 Research Pass

Generated: 2026-09-24
Scope: real-world risk events with observable project/schedule impact, collected as **candidates**
for the L3 (risk -> impact -> response) ground-truth layer described in the REPLAN dataset strategy.
This is a **research pass only** — nothing here has been used to build any synthetic L1 WBS or any
pipeline code. Full detail (sources, hedged/uncertain language, notes on fact-vs-inference) lives in
[`l3_candidates.json`](./l3_candidates.json); this file is a quick-scan summary.

**Ground rules applied:** no invented delay numbers, no invented responses, fact vs. inference kept
separate in notes, the same underlying event was not split into multiple candidates, quality was
prioritized over hitting a specific count.

## Summary table

| Candidate | Project | Country | Risk | Impact | Numeric Delay | Response | Grade | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L3-001 | HL-GA Metaplant (Hyundai/LG battery plant) | USA (Georgia) | labor (ICE raid) | Construction workforce sharply cut; CEO confirmed delay | ~2-3 months (CEO estimate); later "monthslong" | Workforce recovery attempt; investment reaffirmed | **A** | [CNN](https://www.cnn.com/2025/09/11/business/hyundai-raid-plant-delay-ceo) |
| L3-002 | TSMC Arizona Fab 1 | USA (Arizona) | labor | Production start pushed back | ~1 year (2024→2025) | Hired local + sent Taiwanese technicians | **A** | [Bloomberg](https://www.bloomberg.com/news/articles/2023-07-20/tsmc-to-delay-us-fab-production-until-2025-over-worker-shortages) |
| L3-003 | TSMC Arizona Fab 2 | USA (Arizona) | labor / funding | Second-fab startup delayed | ~1-2 years (2026→2027/28), approximate | Not verified | B | [Construction Dive](https://www.constructiondive.com/news/tsmc-deal-arizona-labor-union-chip-factory/704847/) |
| L3-004 | Micron Clay Megafab | USA (New York) | labor / construction | First-fab opening pushed back | 2-3 years (2028→2030), explicit | Completed SEQR environmental review | **A** | [Construction Dive](https://www.constructiondive.com/news/micron-delay-construction-new-york-megafab/805622/) |
| L3-005 | Samsung Austin fab (+ NXP, Infineon, same storm) | USA (Texas) | weather / natural disaster | Fab shut down by grid emergency | ~5+ weeks (Samsung); ~4 weeks (NXP) | Phased restart/ramp-up | **A** | [Bloomberg](https://www.bloomberg.com/news/articles/2021-02-17/texas-power-failure-shuts-chip-factories-squeezes-tight-supply) |
| L3-006 | Rivian Georgia EV plant | USA (Georgia) | contractor/construction (financial driver) | Construction paused, then restarted | ~18 months pause (Mar 2024→Sep 2025) | DOE loan secured; investment reaffirmed | **A** | [ENR](https://www.enr.com/articles/58290-rivian-pauses-5b-electric-vehicle-plant-in-georgia) |
| L3-007 | GM North American plants (Ft Wayne, Silao, Wentzville) | USA / Mexico | supply chain / logistics | Multiple plants paused | 1-2 weeks per plant, explicit | Prioritized chip allocation to high-margin vehicles | **A** | [Washington Post](https://www.washingtonpost.com/technology/2021/04/08/gm-manufacturing-chip-shortage/) |
| L3-008 | Renesas Naka Factory (N3 building) fire | Japan | equipment (fire — category mismatch) | Line destroyed, phased recovery | ~29 days to 10% restart; ~97 days to 100% | 10-part public recovery disclosures | **A** | [Renesas official](https://www.renesas.com/en/about/press-room/update-9-notice-regarding-semiconductor-manufacturing-factory-naka-factory-fire-production-capacity) |
| L3-009 | Intel Ohio One fabs | USA (Ohio) | regulation/policy & funding | Multi-year slip, repeated delays | ~5 years cumulative (2025→2030→2031) | "Prudent approach" statement only | B | [CNBC](https://www.cnbc.com/2025/02/28/intel-delays-ohio-plant-opening-to-2030-production-was-to-start-2026.html) |
| L3-010 | Samsung Foundry Taylor, TX fab | USA (Texas) | equipment / process yield | Mass production repeatedly delayed | ~2+ years, approximate | Skipped 4nm, jumped to 2nm GAA | B | [Tom's Hardware](https://www.tomshardware.com/tech-industry/samsungs-yield-issues-reportedly-delays-taylor-fab-launch-to-2026) |
| L3-011 | Ford BlueOval City | USA (Tennessee) | none listed fits (demand/strategy) | Truck production delayed | ~2 years (2025→2027) | Shifted capex toward hybrids | B | [Tennessee Lookout](https://tennesseelookout.com/2024/08/22/production-at-fords-west-tenn-plant-delayed-to-2027-in-attempt-to-improve-profitability/) |
| L3-012 | Panasonic De Soto, KS battery plant | USA (Kansas) | geopolitical/trade (tax credit policy) | Full production target removed | Open-ended, not verified | Partial opening + limited-scale production | B | [Kansas Reflector](https://kansasreflector.com/2025/07/11/panasonic-to-delay-production-at-kansas-battery-plant-as-electric-car-sales-decline-policies-shift/) |
| L3-013 | VinFast North Carolina plant | USA (North Carolina) | regulation/permitting + financial | Cumulative multi-year slip | ~4 years (2024→2028) | Reduced building footprint, resubmitted permits | B | [Axios](https://www.axios.com/local/raleigh/2024/07/15/vinfast-north-north-carolina-factory-delay-2028) |
| L3-014 | CATL Debrecen battery plant | Hungary | regulation/permitting + labor safety | Cell lines not yet in mass production | Not verified | Required safety rectifications | B | [Caixin](https://www.caixinglobal.com/2026-09-02/catls-hungary-cell-plant-halted-after-nickel-exposure-incident-102480858.html) |
| L3-015 | Samsung SDI Göd battery plant | Hungary | regulation/permitting | Not verified | Not verified | Not verified | C | [Balkan Insight](https://balkaninsight.com/2026/02/23/battery-makers-a-toxic-debate-in-hungarys-election/rd/) |
| L3-016 | Northvolt Canada (Quebec) plant | Canada | contractor/construction (financial distress) | Possible schedule slip reported | "up to 18 months" (hedged estimate) | Not verified | C | [S&P Global](https://autotechinsight.spglobal.com/news/5277858/northvolts-battery-plant-in-canada-may-be-delayed-by-up-to-18-months) |
| L3-017 | Ford Kansas City Assembly / Focus plant | USA | supply chain / logistics | Plants paused | 2 weeks (KC); ~1 month (Focus) | Prioritized chip allocation | **A** | [CBS News](https://www.cbsnews.com/news/gm-and-ford-semiconductor-plant-closing-michigan-illinois-missouri-auto-industry/) |
| L3-018 | Global auto supply chain (rare earths) | China / global | geopolitical / trade | Industry-wide production delays | 8-12 weeks (license approvals, industry-wide) | Inventory buffering, supplier diversification (unconfirmed) | C | [CNBC](https://www.cnbc.com/2025/10/15/auto-industry-raises-the-alarm-as-china-tightens-rare-earth-curbs.html) |

## Grade breakdown

- **Grade A: 8** — L3-001, L3-002, L3-004, L3-005, L3-006, L3-007, L3-008, L3-017
- **Grade B: 7** — L3-003, L3-009, L3-010, L3-011, L3-012, L3-013, L3-014
- **Grade C: 3** — L3-015, L3-016, L3-018

## Strongest 5 candidates

1. **L3-001 — Hyundai/LG Georgia battery plant, ICE raid (2025-09-04).** Real, recent, named joint-venture project; a dated trigger event; a numeric delay stated directly by the CEO (2-3 months); corroborated by later reporting of the actual opening slipping to April 2026. Best available labor-category case.
2. **L3-008 — Renesas Naka factory fire (2021-03-19).** Official company source with a full day-by-day recovery curve (10% at day 29, 88% by end of May, 100% by day ~97, shipments normalized ~18 weeks out). Uniquely rich for modeling *impact decay over time* rather than a single delay scalar.
3. **L3-005 — Texas Winter Storm Uri (2021-02-15).** Clean single external weather event with an independently corroborated numeric recovery window (~5 weeks for Samsung, ~4 weeks for NXP) and documented financial impact ($100M+ at NXP alone).
4. **L3-004 — Micron Clay, NY megafab labor/construction delay.** Company- and county-attributed explicit "2-3 years" delay figure tied to a specific, large, still-active project — strong for the labor/contractor-construction category central to the service's original pain point.
5. **L3-006 — Rivian Georgia EV plant construction pause.** Extremely clean before/after dates (pause announced March 2024, restart groundbreaking September 16, 2025 — ~18 months), with follow-on DOE financing detail, even though the root driver is financial/strategic rather than a pure external shock.

*(Honorable mention: L3-002, TSMC Arizona Fab 1, and L3-007/L3-017, the 2021 GM/Ford chip-shortage plant pauses, are also strong, cleanly-sourced Grade A cases — see the full table above.)*

## Key data gaps found during verification

- **Hungary battery-plant cases (L3-014, L3-015) — the closest real-world match to the original "헝가리 환경 규제" example — have confirmed risk events but no confirmed numeric delay-day figure** in the English-language sources reviewed. This is the single highest-value gap to close next, ideally via Hungarian-language sources or CATL/Samsung SDI official statements.
- **Several strong-looking cases turn out to be demand/strategy-driven rather than externally-triggered** (Rivian, Ford BlueOval City, Panasonic Kansas, parts of VinFast NC) — these don't map cleanly onto the eight risk categories in the brief (regulation, supply chain, labor, weather, geopolitical, contractor, utility, equipment). Recommend the team decide whether to (a) keep them as "negative controls" / contrast cases, (b) extend the taxonomy with a "demand/financial" category, or (c) drop them from the final L3 set.
- **Industrial fire/accident doesn't have a clean home in the eight listed risk categories** (Renesas case, L3-008) despite being one of the best-documented cases found. Recommend adding a category or folding it under "equipment" explicitly.
- **Geopolitical/trade is underrepresented by project-specific cases.** The only two candidates found (L3-012 Panasonic tax-credit policy, L3-018 rare-earth export controls) are either open-ended (no new target date) or industry-wide rather than tied to one named project's schedule. A follow-up search specifically for a single named factory whose schedule was demonstrably moved by a tariff or export-control action would strengthen this category.
- **Numbers described with hedging language** ("may be delayed by up to 18 months" for Northvolt Canada, L3-016) must not be treated as confirmed ground truth without a follow-up source confirming the realized outcome — flagged explicitly in that candidate's notes.
- All candidates were built from search-result summaries rather than full primary-article reads in this pass; before promoting any candidate to final ground truth, each should be re-confirmed against its primary source directly.

---
*This file and `l3_candidates.json` are STEP 1 outputs only. No L1 synthetic WBS and no implementation code were created in this pass, per task scope.*
