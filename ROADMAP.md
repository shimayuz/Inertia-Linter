# Inertia Linter - Atomic Task Roadmap

## Current State: Pre-Implementation (src/ does not exist)

**Total Atomic Tasks: 147**
**Critical Path Tasks: 68 (P0/P1)**
**Emergency MVP Tasks: 42 (P0 only)**

---

## Phase 0: Foundation (Day 1, 9:00-10:30) — 18 tasks

### 0-A: Project Scaffold (F-01, F-04, F-05)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 001 | `npm create vite@latest` with React + TypeScript template | 3min | - | P0 |
| 002 | Install Tailwind CSS + PostCSS + autoprefixer | 3min | 001 | P0 |
| 003 | Configure `tailwind.config.ts` (content paths) | 2min | 002 | P0 |
| 004 | Set up `src/index.css` with Tailwind directives | 2min | 002 | P0 |
| 005 | Install Recharts | 2min | 001 | P1 |
| 006 | Install Zod | 1min | 001 | P0 |
| 007 | Install Vitest + @testing-library/react + jsdom | 3min | 001 | P0 |
| 008 | Configure `vitest.config.ts` (jsdom, coverage) | 3min | 007 | P0 |
| 009 | Create folder structure: `src/{types,engine,data,components,hooks}` | 2min | 001 | P0 |
| 010 | Verify `npm run dev` serves blank React app | 1min | 001-004 | P0 |
| 011 | Verify `npm run test` runs (0 tests, 0 failures) | 1min | 007-008 | P0 |

### 0-B: Type System (F-02)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 012 | `src/types/ef-category.ts` — EFCategory enum (HFrEF/HFmrEF/HFpEF) | 3min | 009 | P0 |
| 013 | `src/types/pillar.ts` — Pillar enum (ARNI_ACEi_ARB, BB, MRA, SGLT2i) + PillarStatus enum (ON_TARGET, UNDERDOSED, MISSING, CONTRAINDICATED, UNKNOWN) | 5min | 009 | P0 |
| 014 | `src/types/blocker.ts` — BlockerCode enum (15 codes) + BlockerInfo type | 5min | 009 | P0 |
| 015 | `src/types/dose-tier.ts` — DoseTier enum (NOT_PRESCRIBED, LOW, MEDIUM, HIGH) + points mapping | 3min | 009 | P0 |
| 016 | `src/types/patient.ts` — PatientSnapshot type (all fields from Section 4.1) + Medication type | 8min | 012-015 | P0 |
| 017 | `src/types/audit.ts` — AuditResult, PillarResult, GDMTScore, MissingInfo types | 8min | 012-016 | P0 |
| 018 | `npx tsc --noEmit` — verify all types compile | 2min | 012-017 | P0 |

### 0-C: Ruleset Data (F-03)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 019 | `src/data/ruleset_hf_gdmt_v2.json` — JSON schema design (rule_id, guideline_id, class, LOE, conditions, thresholds, DOI) | 15min | 012-015 | P0 |
| 020 | Ruleset: ARNI/ACEi/ARB pillar rules (AHA + ESC) | 10min | 019 | P0 |
| 021 | Ruleset: Beta-blocker pillar rules | 8min | 019 | P0 |
| 022 | Ruleset: MRA pillar rules (spironolactone + eplerenone + finerenone) | 10min | 019 | P0 |
| 023 | Ruleset: SGLT2i pillar rules (HFrEF + HFpEF, AHA vs ESC) | 10min | 019 | P0 |
| 024 | Ruleset: Blocker thresholds per pillar (BP_LOW, HR_LOW, K_HIGH, EGFR_LOW_INIT, EGFR_LOW_CONT) | 10min | 019 | P0 |
| 025 | Ruleset: eGFR initiation vs continuation thresholds per drug class | 8min | 024 | P0 |
| 026 | TypeScript type for Ruleset + Zod validation schema | 8min | 019, 006 | P0 |

**Phase 0 Gate**: `npm run dev` OK, `npx tsc --noEmit` OK, `npm run test` OK (0 tests)

---

## Phase 1: Rule Engine Core (Day 1, 10:30-15:30) — 38 tasks

### 1-A: EF Category Classifier (E-01)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 027 | `src/engine/__tests__/classify-ef.test.ts` — RED: EF <= 40 -> HFrEF | 3min | 012 | P0 |
| 028 | Test: EF 41-49 -> HFmrEF | 2min | 027 | P0 |
| 029 | Test: EF >= 50 -> HFpEF | 2min | 027 | P0 |
| 030 | Test: Edge cases (EF=40, EF=41, EF=49, EF=50, EF=0, EF=100) | 3min | 027 | P0 |
| 031 | `src/engine/classify-ef.ts` — GREEN: implement classifyEF() | 5min | 027-030 | P0 |
| 032 | Verify all tests pass | 1min | 031 | P0 |

### 1-B: Stale Data Detection (E-06)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 033 | `src/engine/__tests__/detect-stale.test.ts` — RED: labs > 14d -> STALE_LABS | 3min | 014 | P0 |
| 034 | Test: vitals > 30d -> STALE_VITALS | 2min | 033 | P0 |
| 035 | Test: fresh data -> no staleness | 2min | 033 | P0 |
| 036 | Test: missing date -> UNKNOWN_LABS | 2min | 033 | P0 |
| 037 | `src/engine/detect-stale.ts` — GREEN: implement detectStaleData() | 8min | 033-036 | P0 |

### 1-C: Dose Tier Matching (E-03)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 038 | `src/engine/__tests__/match-dose-tier.test.ts` — RED: NOT_PRESCRIBED -> 0pts | 3min | 015 | P0 |
| 039 | Test: LOW -> 8pts, MEDIUM -> 16pts, HIGH -> 25pts | 3min | 038 | P0 |
| 040 | Test: SGLT2i (fixed dose = HIGH always) | 2min | 038 | P0 |
| 041 | `src/engine/match-dose-tier.ts` — GREEN: implement getDoseTierPoints() | 5min | 038-040 | P0 |

### 1-D: Blocker Code Detection (E-04)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 042 | `src/engine/__tests__/detect-blockers.test.ts` — RED: SBP < 100 -> BP_LOW | 3min | 014, 016 | P0 |
| 043 | Test: HR < 60 -> HR_LOW | 2min | 042 | P0 |
| 044 | Test: K+ > 5.0 -> K_HIGH | 2min | 042 | P0 |
| 045 | Test: eGFR < init threshold -> EGFR_LOW_INIT | 3min | 042, 025 | P0 |
| 046 | Test: eGFR < cont threshold -> EGFR_LOW_CONT | 3min | 042, 025 | P0 |
| 047 | Test: labs stale -> STALE_LABS (delegates to detect-stale) | 2min | 042, 037 | P0 |
| 048 | Test: unknown labs -> UNKNOWN_LABS | 2min | 042 | P0 |
| 049 | Test: ADR_HISTORY flag | 2min | 042 | P0 |
| 050 | Test: ALLERGY flag | 2min | 042 | P0 |
| 051 | Test: no blocker found -> CLINICAL_INERTIA | 3min | 042 | P0 |
| 052 | Test: multiple blockers per pillar | 3min | 042 | P0 |
| 053 | `src/engine/detect-blockers.ts` — GREEN: implement detectBlockers() | 20min | 042-052 | P0 |

### 1-E: eGFR Split Logic (E-07)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 054 | `src/engine/__tests__/egfr-thresholds.test.ts` — RED: SGLT2i init vs cont | 3min | 025 | P0 |
| 055 | Test: MRA init vs cont thresholds | 3min | 054 | P0 |
| 056 | Test: ARNI init vs cont thresholds | 2min | 054 | P0 |
| 057 | `src/engine/egfr-thresholds.ts` — GREEN: implement getEGFRThreshold() | 8min | 054-056 | P0 |

### 1-F: Pillar Status Evaluator (E-02)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 058 | `src/engine/__tests__/evaluate-pillar.test.ts` — RED: med at HIGH -> ON_TARGET | 3min | 013, 016 | P0 |
| 059 | Test: med at LOW/MEDIUM -> UNDERDOSED | 3min | 058 | P0 |
| 060 | Test: no med, no blocker -> MISSING | 3min | 058 | P0 |
| 061 | Test: documented contraindication -> CONTRAINDICATED | 3min | 058 | P0 |
| 062 | Test: insufficient data -> UNKNOWN | 3min | 058 | P0 |
| 063 | Test: HFrEF -> evaluate all 4 pillars | 3min | 058 | P0 |
| 064 | Test: HFpEF -> SGLT2i primary + comorbidity checks | 3min | 058 | P0 |
| 065 | `src/engine/evaluate-pillar.ts` — GREEN: implement evaluatePillar() | 15min | 058-064, 053, 057, 041 | P0 |

### 1-G: GDMT Score Calculator (E-05)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 066 | `src/engine/__tests__/calculate-score.test.ts` — RED: all HIGH -> 100/100 | 3min | 017 | P0 |
| 067 | Test: Case 1 expected -> 24/100 | 3min | 066 | P0 |
| 068 | Test: CONTRAINDICATED pillar -> exclude from denominator, normalize | 5min | 066 | P0 |
| 069 | Test: UNKNOWN pillar -> score with asterisk "incomplete data" | 3min | 066 | P0 |
| 070 | Test: all NOT_PRESCRIBED -> 0/100 | 2min | 066 | P0 |
| 071 | Test: Case 3 expected -> 41/100 | 3min | 066 | P0 |
| 072 | `src/engine/calculate-score.ts` — GREEN: implement calculateGDMTScore() | 12min | 066-071 | P0 |

### 1-H: Audit Pipeline + Case 1 Integration (E-08, E-09)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 073 | `src/engine/audit.ts` — orchestrator: runAudit(patient) -> AuditResult | 10min | 031, 065, 072 | P0 |
| 074 | `src/data/cases/case1.ts` — Case 1 synthetic data (68M HFrEF EF30%) | 8min | 016 | P0 |
| 075 | `src/data/expected/case1-expected.ts` — Expected output (GDMT 24/100) | 8min | 017 | P0 |
| 076 | `src/engine/__tests__/audit-case1.test.ts` — Full pipeline test | 10min | 073-075 | P0 |
| 077 | Verify: ARNI/ACEi/ARB = UNDERDOSED, Blocker = CLINICAL_INERTIA | 3min | 076 | P0 |
| 078 | Verify: BB = UNDERDOSED, Blocker = CLINICAL_INERTIA | 2min | 076 | P0 |
| 079 | Verify: MRA = MISSING, Blocker = CLINICAL_INERTIA | 2min | 076 | P0 |
| 080 | Verify: SGLT2i = MISSING, Blocker = ADR_HISTORY | 2min | 076 | P0 |
| 081 | `npx vitest run --coverage` — engine/ 80%+ | 2min | 076 | P0 |

**Phase 1 Gate**: Case 1 -> GDMT 24/100, all unit tests green, coverage 80%+

---

## Phase 2: UI Dashboard (Day 1, 15:30-17:30) — 22 tasks

### 2-A: Patient Input Form (U-01, U-02)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 082 | `src/components/PatientForm.tsx` — scaffold with all fields from Section 4.1 | 10min | 016 | P0 |
| 083 | EF (%) number input + NYHA dropdown (I/II/III/IV) | 5min | 082 | P0 |
| 084 | SBP + HR number inputs | 3min | 082 | P0 |
| 085 | Vitals date picker | 3min | 082 | P0 |
| 086 | eGFR + K+ number inputs (optional) | 3min | 082 | P0 |
| 087 | Labs date picker | 3min | 082 | P0 |
| 088 | BNP/NT-proBNP input (optional) | 2min | 082 | P2 |
| 089 | DM Type dropdown (None/1/2, optional) | 2min | 082 | P1 |
| 090 | Medication list: 4 pillars x (name + dose tier dropdown) | 10min | 082, 015 | P0 |
| 091 | ADR history checkbox per pillar | 3min | 082 | P0 |
| 092 | `src/hooks/usePatientForm.ts` — form state management | 8min | 082 | P0 |
| 093 | `src/types/form-schema.ts` — Zod validation schema | 8min | 016, 006 | P0 |
| 094 | Wire Zod validation to form submit | 5min | 092, 093 | P0 |
| 095 | Demo case quick-fill buttons (Case 1/2/3) | 5min | 074 | P0 |

### 2-B: Pillar Status Cards (U-03)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 096 | `src/components/PillarCard.tsx` — single pillar card (status badge + color + blocker) | 10min | 013, 014 | P0 |
| 097 | Status badge color mapping: green/amber/red/gray/purple | 5min | 096 | P0 |
| 098 | Blocker code display with UI-friendly labels (not internal codes) | 5min | 096 | P0 |
| 099 | `src/components/PillarDashboard.tsx` — 4 cards in grid | 5min | 096 | P0 |

### 2-C: GDMT Score Display (U-04)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 100 | `src/components/GDMTScore.tsx` — score display (XX/100) | 8min | 017 | P0 |
| 101 | Score color gradient (0-30 red, 31-60 amber, 61-100 green) | 3min | 100 | P0 |
| 102 | CONTRA exclusion note ("calculated from N pillars") | 3min | 100 | P0 |

### 2-D: Layout + Wiring (U-05, U-06)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 103 | `src/components/Dashboard.tsx` — 3-pane layout (25% / 45% / 30%) | 8min | 082, 099, 100 | P0 |
| 104 | `src/components/DetailPanel.tsx` — right pane scaffold | 5min | 103 | P0 |
| 105 | Wire: Form submit -> runAudit() -> update dashboard state | 8min | 073, 092, 103 | P0 |
| 106 | Verify: Case 1 quick-fill -> correct pillar cards render | 3min | 105, 095 | P0 |

**Phase 2 Gate**: Case 1 data -> 4-pillar cards with correct colors, GDMT 24/100 displayed

---

## Phase 3: Inertia Buster + Safety UI (Day 1, 17:30-20:00) — 20 tasks

### 3-A: Inertia Buster (B-01, B-02, B-03)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 107 | `src/types/inertia-buster.ts` — InertiaInfo, BarrierResponse types | 5min | 014 | P1 |
| 108 | `src/data/inertia-buster-sglt2i.ts` — SGLT2i barrier-specific content (UTI, GI, hypo, eGFR, never considered) | 15min | 107 | P1 |
| 109 | `src/data/inertia-buster-arni.ts` — ARNI/ACEi/ARB barrier content | 10min | 107 | P2 |
| 110 | `src/data/inertia-buster-bb.ts` — Beta-blocker barrier content | 10min | 107 | P2 |
| 111 | `src/data/inertia-buster-mra.ts` — MRA barrier content | 10min | 107 | P2 |
| 112 | `src/engine/get-inertia-info.ts` — lookup barrier info by pillar + blocker code | 8min | 107, 108 | P1 |
| 113 | `src/components/InertiaBuster.tsx` — display barrier info + "for consideration" framing | 10min | 112 | P1 |
| 114 | CLINICAL_INERTIA -> "No identified blocker - Eligible to consider intensification" (UI label transform) | 5min | 098 | P0 |
| 115 | CLINICAL_INERTIA tooltip text implementation | 3min | 114 | P0 |
| 116 | Reason input UI: multi-select + free-text "Other" per pillar | 10min | 104 | P1 |

### 3-B: Safety UI (S-01~S-05)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 117 | `src/components/DemoModeBadge.tsx` — "DEMO MODE - SYNTHETIC DATA ONLY" (yellow, top-left, always visible) | 5min | - | P0 |
| 118 | `src/components/DisclaimerBanner.tsx` — sticky disclaimer at top of every screen | 5min | - | P0 |
| 119 | `src/components/labels/AIGeneratedLabel.tsx` — "This explanation is AI-generated" | 3min | - | P0 |
| 120 | `src/components/labels/RuleDerivedLabel.tsx` — "Derived from Guideline-as-Code ruleset v2" | 3min | - | P0 |
| 121 | `src/components/labels/DraftWatermark.tsx` — "DRAFT - Pending physician review" | 3min | - | P0 |
| 122 | Integrate all safety elements into Dashboard layout | 5min | 117-121, 103 | P0 |
| 123 | No-blame language grep: verify "clinical inertia" never appears in user-facing strings | 5min | 114 | P0 |

### 3-C: Day 1 Integration (I-01)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 124 | Full flow test: open app -> quick-fill Case 1 -> verify dashboard | 10min | 105, 122 | P0 |
| 125 | Verify all 6 safety UI elements visible | 5min | 122 | P0 |
| 126 | `npx tsc --noEmit && npm run test && npm run build` — Day 1 build gate | 5min | 124 | P0 |

**Phase 3 Gate**: Case 1 full flow works, all safety UI visible, no "clinical inertia" in UI

---

## Phase 4: Pictograph + Multi-Guideline (Day 2, 9:00-12:00) — 18 tasks

### 4-A: Pictograph (P-01~P-03)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 127 | `src/components/Pictograph.tsx` — 100-person icon grid (10x10) | 15min | - | P1 |
| 128 | Color assignment: green (benefit), red (harm), gray (unaffected) | 5min | 127 | P1 |
| 129 | Animation: icons fill in sequentially | 10min | 127 | P2 |
| 130 | `src/data/pictograph-sglt2i-hfref.ts` — DAPA-HF + EMPEROR-R trial data (ARR, NNT, harm rates) | 10min | - | P1 |
| 131 | Mandatory disclaimer text below pictograph | 3min | 127 | P1 |
| 132 | Wire pictograph into Detail Panel for Case 1 SGLT2i | 5min | 127, 130, 104 | P1 |

### 4-B: Multi-Guideline Display (M-01~M-03)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 133 | `src/types/guideline.ts` — GuidelineComparison, GuidelineSource types | 5min | - | P1 |
| 134 | `src/data/guideline-differences.ts` — AHA vs ESC differences table (Section 2.3.1) | 10min | 133 | P1 |
| 135 | `src/components/GuidelineComparison.tsx` — side-by-side display ("AHA: 2a / ESC: I-A") | 10min | 133, 134 | P1 |
| 136 | Highlight when guidelines differ (visual distinction) | 5min | 135 | P1 |

### 4-C: Case 2 HFpEF (C2-01~C2-03)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 137 | `src/data/cases/case2.ts` — Case 2 synthetic data (75F HFpEF EF58%) | 8min | 016 | P1 |
| 138 | `src/data/expected/case2-expected.ts` — Expected output (SGLT2i MISSING, finerenone OPPORTUNITY) | 8min | 017 | P1 |
| 139 | `src/engine/__tests__/hfpef-score.test.ts` — RED: HFpEF Management Score tests | 5min | 017 | P1 |
| 140 | `src/engine/hfpef-score.ts` — GREEN: implement calculateHFpEFScore() | 10min | 139 | P1 |
| 141 | `src/engine/__tests__/audit-case2.test.ts` — Full pipeline test for Case 2 | 8min | 137-140 | P1 |
| 142 | Quick-fill Case 2 button + verify multi-guideline display | 5min | 141, 135 | P1 |

**Phase 4 Gate**: Pictograph renders for Case 1, Case 2 shows AHA vs ESC differences

---

## Phase 5: Complex Case + LLM (Day 2, 13:00-15:30) — 16 tasks

### 5-A: Case 3 (C3-01~C3-03)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 143 | `src/data/cases/case3.ts` — Case 3 synthetic data (72M HFrEF EF25%) | 8min | 016 | P1 |
| 144 | `src/data/expected/case3-expected.ts` — Expected output (GDMT 41/100, BP_LOW, K_HIGH) | 8min | 017 | P1 |
| 145 | `src/engine/__tests__/appropriate-non-escalation.test.ts` — RED: all pillars on, all underdosed, real blockers | 5min | 073 | P1 |
| 146 | "Appropriate non-escalation" message logic (all real blockers -> affirm current therapy) | 8min | 145 | P1 |
| 147 | `src/engine/__tests__/audit-case3.test.ts` — Full pipeline test | 8min | 143-146 | P1 |
| 148 | Quick-fill Case 3 button + verify | 3min | 147 | P1 |

### 5-B: LLM Integration (L-01~L-04)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 149 | `src/types/llm.ts` — LLMRequest (abstract codes only), LLMResponse types | 5min | 013, 014 | P2 |
| 150 | `src/engine/prepare-llm-context.ts` — strip patient values, keep only status + blocker codes | 8min | 149, 017 | P2 |
| 151 | `src/engine/__tests__/prepare-llm-context.test.ts` — verify NO patient values in output | 5min | 150 | P2 |
| 152 | `src/hooks/useLLMExplanation.ts` — Claude API call with prepared context | 10min | 150 | P2 |
| 153 | API key from env variable only (`VITE_CLAUDE_API_KEY`) | 3min | 152 | P2 |
| 154 | `src/components/LLMExplanation.tsx` — display with AI-generated label | 8min | 152, 119 | P2 |
| 155 | Graceful degradation: if API fails, show "Explanation unavailable" | 5min | 152 | P2 |
| 156 | PHI isolation test: mock API call, verify no patient numbers in request body | 8min | 150 | P2 |

**Phase 5 Gate**: Case 3 shows "appropriate non-escalation", LLM explains (or gracefully degrades)

---

## Phase 6: Polish + Deploy (Day 2, 15:30-19:00) — 15 tasks

### 6-A: Export (X-01~X-04)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 157 | `src/engine/export-soap.ts` — SOAP-style export format | 12min | 017 | P2 |
| 158 | `src/engine/export-problem-list.ts` — Problem-list style export | 10min | 017 | P2 |
| 159 | `src/engine/export-json.ts` — Raw JSON export | 5min | 017 | P2 |
| 160 | `src/components/ExportButton.tsx` — one-click export with format selector | 8min | 157-159 | P2 |
| 161 | Draft watermark in all export content | 3min | 160, 121 | P2 |

### 6-B: Audits + Testing (SA-01~SA-03)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 162 | Safety UI audit: verify all 6 elements on every screen/state | 10min | 122 | P0 |
| 163 | PHI leakage audit: grep for patient values near API/fetch patterns | 10min | 156 | P0 |
| 164 | No-blame language audit: grep for "clinical inertia" in all UI/export text | 5min | 123 | P0 |
| 165 | Run full test suite: `npx vitest run --coverage` (target 80%+) | 5min | all engine | P0 |

### 6-C: Deploy + Demo (D-01~DM-02)

| # | Task | Est | Deps | Priority |
|---|------|-----|------|----------|
| 166 | Vercel project setup + deploy | 10min | 165 | P0 |
| 167 | Production smoke test (3 cases on deployed URL) | 10min | 166 | P0 |
| 168 | Demo script: 7 pitch sections, 5min total (ref Section 7) | 15min | 167 | P0 |
| 169 | Demo rehearsal: 3 cases in 2.5min | 15min | 168 | P0 |
| 170 | Final build: `npx tsc --noEmit && npm run test && npm run build` | 3min | all | P0 |
| 171 | Git init + initial commit + push | 5min | 170 | P0 |

**Phase 6 Gate**: Deployed, all audits pass, demo rehearsed

---

## Critical Path (最短経路)

```
001 -> 009 -> 012~017 -> 019~026 -> 027~032 -> 042~053 -> 058~065 -> 066~072
    -> 073~081 -> 082~095 -> 096~106 -> 117~126 -> 166~171
    [ここまでが Emergency MVP: 42 tasks]

    Optional path (P1):
    -> 107~116 (Inertia Buster)
    -> 127~132 (Pictograph)
    -> 133~142 (Multi-guideline + Case 2)
    -> 143~148 (Case 3)

    Optional path (P2):
    -> 149~156 (LLM)
    -> 157~161 (Export)
```

---

## Time Budget Summary

| Phase | Tasks | P0 | P1 | P2 | Est. Time |
|-------|-------|----|----|-----|-----------|
| Phase 0: Foundation | 26 | 25 | 1 | 0 | 1.5h |
| Phase 1: Rule Engine | 55 | 55 | 0 | 0 | 4h |
| Phase 2: UI Dashboard | 25 | 23 | 1 | 1 | 2h |
| Phase 3: Inertia Buster + Safety | 20 | 12 | 8 | 0 | 2h |
| Phase 4: Pictograph + Multi-GL | 16 | 0 | 15 | 1 | 2.5h |
| Phase 5: Case 3 + LLM | 14 | 0 | 6 | 8 | 2h |
| Phase 6: Polish + Deploy | 15 | 8 | 0 | 7 | 2.5h |
| **Total** | **171** | **123** | **31** | **17** | **~16.5h** |

---

## Parallel Execution Plan

### Day 1 Parallel Tracks

```
Track A (Engine):     001 -> 012-026 -> 027-081
Track B (UI):                          082-106 (starts after Phase 1 types ready)
Track C (Safety UI):                   117-123 (independent, start anytime Day 1)
```

### Day 2 Parallel Tracks

```
Track A (Pictograph):     127-132
Track B (Multi-GL):       133-136 + 137-142
Track C (Case 3):                      143-148
Track D (LLM):                         149-156
Track E (Export):                       157-161
Track F (Deploy):                                166-171
```

---

## Decision Points (カットライン)

| Checkpoint | Time | If Behind | Cut |
|-----------|------|-----------|-----|
| Phase 1 Midpoint | Day 1 12:00 | E-06, E-07 not done | Defer stale detection to Phase 4 |
| Phase 1 Complete | Day 1 15:30 | E-09 not passing | Skip E-09 integration, go to UI |
| Phase 2 Complete | Day 1 17:30 | UI not rendering | Switch to 2-pane layout |
| Day 1 End | Day 1 20:00 | Phase 3 incomplete | Phase 3 -> Day 2 morning |
| Phase 4 Midpoint | Day 2 10:30 | Behind | Drop pictograph, keep multi-GL |
| Phase 4 Complete | Day 2 12:00 | Case 2 broken | Drop Case 2, keep GL display |
| Phase 5 Complete | Day 2 14:30 | LLM not working | Drop LLM entirely |
| Phase 6 Midpoint | Day 2 17:00 | Exports broken | Skip exports |
| FINAL | Day 2 19:00 | Anything broken | Emergency MVP + rehearsal |

---

## Emergency MVP (最終防衛線: 42 tasks, ~8h)

Case 1 HFrEF only. No LLM, no pictograph, no multi-guideline, no export.
Tasks: 001-011, 012-018, 019-026, 027-032, 038-041, 042-053, 058-065, 066-081, 082-084, 086, 090-095, 096-106, 114-115, 117-118, 120-122, 166-171

**This alone proves**: "I can detect where GDMT has stalled and why."
