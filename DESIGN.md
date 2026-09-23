# REPLAN design contract

## Source of truth

- Status: Active direction; the current UI is an MVP and has not yet been visually aligned.
- Last refreshed: 2026-09-23.
- Primary surfaces: onboarding, Overview, Changes, Schedule, Scenarios, Actions, History.
- Evidence reviewed: `REPLAN_PROJECT_MASTER.md`, `apps/web/app/page.tsx`, `apps/web/app/styles.css`, `assets/brand/README.md`, and the local Lazyweb REPLAN UX/UI research report dated 2026-09-23.
- This file is the portable implementation brief. The local research folder contains third-party reference screenshots and is not part of the repository.

## Brand

- Personality: calm, precise, trustworthy operational software; editorial in presentation, dense where work requires it.
- Trust signals: distinguish calculated values, inferred interpretation, evidence freshness, and items awaiting human confirmation.
- Avoid: empty AI chat as the entry point, unsupported “optimal” claims, purple gradients, glow, decorative card overload, and copying Excel wholesale into a web table.
- Use the approved **REPLAN** wordmark and compact mark from `apps/web/public/brand/`. `assets/brand/replan/README.md` is authoritative for logo usage. The older `RE:PLAN` spelling in the research and MVP copy is not the approved visual identity.

## Product goals

- Goals: make a changed project schedule understandable, compare feasible responses, and move an approved decision into actions and Excel output.
- Non-goals: general-purpose AI chat, full ERP, or automatic approval without evidence and human review.
- Success signals: a user can identify what changed, its schedule/cost impact, the outstanding confirmation, and the next action without prompting the AI.

## Personas and jobs

- Primary personas: project manager/planner, procurement or vendor coordinator, and approver.
- Jobs: import a schedule, inspect change evidence, evaluate alternatives against constraints, approve a version, and follow assigned actions.
- Context: desktop-first, information-dense B2B work with occasional smaller-screen review.

## Information architecture

- Primary navigation: Overview / Changes / Schedule / Scenarios / Actions / History.
- First-use flow: Upload → Map → Review → Monitor → Overview.
- Repeated flow: detect change → show impact and evidence → compare scenarios → confirm assumptions → approve → create actions and Excel output.
- Overview hierarchy: decision needed today, new changes, largest impacts, active actions, then overall project status. Lead with actionable language rather than abstract health scores.

## Design principles

1. Show the decision and its evidence before exposing detailed data or AI process.
2. Put dates, cost, affected tasks, and required confirmations on common comparison axes.
3. Ask humans only for the missing facts or approvals; use structured controls for constraints.
4. Highlight the affected schedule segment and dependencies rather than shrinking an entire Gantt chart into one panel.
- Tradeoff: use the dark “control room” treatment only for focused impact analysis; keep normal workflows on a light surface.

## Visual language

- Color direction: warm ivory `#F4F1EA`, ink `#172033`, deep navy `#0B1628`, cobalt `#315BFF`, mint `#65C7A3`, amber `#E7A83E`, coral `#DF625E`. These are target tokens; existing CSS values are not yet fully migrated.
- Typography: strong editorial headings, compact and highly legible operational text; use a Korean-capable system/Pretendard fallback stack.
- Spacing/layout rhythm: generous landing whitespace; tighter workspace spacing with stable navigation and a contextual evidence panel.
- Shape/elevation: thin borders, restrained shadows, roughly 10–12px radii; reserve rounded pills for actual statuses.
- Motion: subtle state transitions only; no animation that delays reading or decisions.
- Imagery/iconography: real product and schedule evidence over abstract AI imagery; approved brand assets only.

## Components

- Existing components to reuse: the current page's upload, preview, event, scenario, approval, and export interactions; preserve their API behavior while restructuring presentation.
- New/changed components: AppShell, SideNav, TopContext, decision-first Overview, Impact Timeline, evidence drawer, common-axis Scenario Compare, confirmation checklist, and decision receipt.
- Variants and states: LIVE versus REPLAY, calculated versus inferred versus needs confirmation, no update versus no impact versus failed/stale source, budget/target/approval eligibility.
- Ownership: `apps/web/app/styles.css` owns shared tokens until a component structure justifies extraction. Avoid adding a UI framework solely for visual restyling.

## Accessibility

- Target standard: WCAG 2.2 AA as the implementation target; verification is pending.
- Keyboard/focus: all controls and drawer actions must work in logical tab order with visible focus.
- Contrast/readability: status must not depend on color alone; show text labels and units for every cost/date delta.
- Semantics: headings, form labels, error associations, table headers, and live status updates must remain understandable to screen readers.
- Motion: respect reduced-motion preferences.

## Responsive behavior

- Desktop: persistent navigation and optional right evidence drawer.
- Tablet: reduce workspace columns and move the drawer below or into an explicit panel.
- Mobile: one primary task at a time; keep comparisons readable by stacking alternatives rather than compressing their metrics.
- Do not hide required confirmations or approval blockers at any breakpoint.

## Interaction states

- Loading: name the running step (import, analysis, simulation, export), preserve context, and prevent duplicate submission.
- Empty: explain the next action, especially before the first Excel upload or change event.
- Error: distinguish validation, authorization, unavailable source, and failed analysis; never label retrieval failure “no risk.”
- Success: show the resulting version/action/export and a clear next step.
- Disabled: explain which missing confirmation, permission, or constraint prevents approval.
- Slow/offline: retain the last known result and its timestamp; make staleness visible.

## Content voice

- Tone: direct, factual Korean; concise verbs and concrete consequences.
- Terminology: use “기준 일정”, “변경”, “영향”, “대응안”, “확인 필요”, “승인”, and “실행 항목” consistently.
- Microcopy: pair numbers with actions and provenance. Do not present inferred statements as calculated facts.

## Implementation constraints

- Framework: Next.js 16, React 19, TypeScript, and repo-native CSS; no new UI dependency is required for the first redesign.
- Keep API contracts and deterministic schedule/cost calculations unchanged during visual work.
- Test/screenshot expectations: verify upload-to-export interaction, keyboard use, responsive layouts, and the distinct loading/empty/error/success states before calling a screen complete.

## Open questions

- [ ] Confirm final role-specific permissions and whether approvers need a separate route (product owner; affects IA and approval UX).
- [ ] Decide whether public landing and authenticated workspace should share one shell (product owner; affects routing).
- [ ] Validate the palette, typography, and mobile layout against actual users and screenshots (design/engineering; affects visual acceptance).
