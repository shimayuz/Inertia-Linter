# Inertia Linter - Implementation Plan

## Cerebral Valley AI Hackathon (Feb 13-14, 2026)

---

## 1. Phase Overview

### Phase 0: Foundation (Day 1, 9:00-10:30) - 1.5h
**Goal**: Project scaffold, type system, data schema

| Task ID | Task | Dependencies | Estimated | Owner |
|---------|------|-------------|-----------|-------|
| F-01 | Vite + React + TypeScript + Tailwind setup | None | 15min | AI Agent |
| F-02 | TypeScript type definitions (types/) | None | 30min | AI Agent |
| F-03 | ruleset_hf_gdmt_v2.json schema + initial data | F-02 | 30min | AI Agent + MD Review |
| F-04 | Folder structure creation (engine/, data/, components/, hooks/) | F-01 | 10min | AI Agent |
| F-05 | Vitest + testing infrastructure setup | F-01 | 15min | AI Agent |

**Completion Criteria**:
- `npm run dev` serves blank React app
- All TypeScript types compile without errors
- `npm run test` runs (0 tests, 0 failures)
- ruleset JSON validates against schema

---

### Phase 1: Rule Engine Core (Day 1, 10:30-15:30) - 5h
**Goal**: Deterministic rule engine for HFrEF 4-pillar analysis

**Priority**: P0 (MVP Critical)

| Task ID | Task | Dependencies | Estimated | Owner |
|---------|------|-------------|-----------|-------|
| E-01 | EF category classifier (HFrEF/HFmrEF/HFpEF) | F-02 | 20min | AI Agent (TDD) |
| E-02 | Pillar status evaluator (ON_TARGET/UNDERDOSED/MISSING/CONTRA/UNKNOWN) | F-02, F-03 | 1h | AI Agent (TDD) |
| E-03 | Dose tier matching (LOW/MEDIUM/HIGH) | F-03 | 30min | AI Agent (TDD) |
| E-04 | Blocker code detection (15 codes) | F-02, F-03 | 1h | AI Agent (TDD) |
| E-05 | GDMT Score calculator (0-100, CONTRA exclusion, UNKNOWN handling) | E-02, E-03 | 45min | AI Agent (TDD) |
| E-06 | Stale data detection (labs >14d, vitals >30d) | F-02 | 20min | AI Agent (TDD) |
| E-07 | eGFR split logic (INIT vs CONT thresholds) | F-03 | 20min | AI Agent (TDD) |
| E-08 | Test cases for Case 1 (68M HFrEF EF30%) | E-01~E-07 | 30min | AI Agent + MD Review |
| E-09 | Integration test: full audit pipeline Case 1 | E-08 | 30min | AI Agent |

**Completion Criteria**:
- Case 1 audit produces correct output (GDMT 24/100)
- All unit tests pass (target: 80%+ coverage on engine/)
- Pure functions, zero external dependencies
- No mutation in any engine function

---

### Phase 2: UI Dashboard (Day 1, 15:30-17:30) - 2h
**Goal**: 3-pane dashboard with patient input and pillar visualization

**Priority**: P0 (MVP Critical)

| Task ID | Task | Dependencies | Estimated | Owner |
|---------|------|-------------|-----------|-------|
| U-01 | Patient Snapshot input form (left pane, 25%) | F-02, F-04 | 40min | AI Agent |
| U-02 | Form validation (Zod schema) | U-01, F-02 | 20min | AI Agent |
| U-03 | Pillar Cards component (center pane, 45%) | F-02 | 30min | AI Agent |
| U-04 | GDMT Score gauge/display | E-05 | 15min | AI Agent |
| U-05 | Detail Panel (right pane, 30%) | F-02 | 20min | AI Agent |
| U-06 | Wire up: Form -> Engine -> Dashboard | E-09, U-01~U-05 | 30min | AI Agent |

**Completion Criteria**:
- Case 1 data entry produces correct dashboard
- Responsive 3-pane layout renders correctly
- Pillar colors match status (green/yellow/red/gray/purple)
- Form validation rejects invalid input

---

### Phase 3: Inertia Buster + Safety (Day 1, 17:30-20:00) - 2.5h
**Goal**: SGLT2i barrier analysis, safety UI elements

**Priority**: P1 (High Value)

| Task ID | Task | Dependencies | Estimated | Owner |
|---------|------|-------------|-----------|-------|
| B-01 | Inertia Buster data structure + SGLT2i content | F-02, F-03 | 30min | AI Agent + MD Review |
| B-02 | Inertia Buster display component | B-01 | 30min | AI Agent |
| B-03 | CLINICAL_INERTIA label ("No identified blocker") | E-04 | 15min | AI Agent |
| S-01 | DEMO MODE badge (persistent) | None | 10min | AI Agent |
| S-02 | Disclaimer banner | None | 10min | AI Agent |
| S-03 | AI-generated / Rule-derived labels | None | 10min | AI Agent |
| S-04 | Draft watermark on exports | None | 10min | AI Agent |
| S-05 | No-blame language audit | B-01~B-03 | 15min | MD Review |
| I-01 | Day 1 integration test (full flow) | All above | 30min | AI Agent |

**Completion Criteria**:
- SGLT2i Inertia Buster displays for Case 1
- All 6 safety UI elements visible
- "Clinical inertia" never appears in UI text
- Integration test passes end-to-end

---

### Phase 4: Pictograph + Multi-guideline (Day 2, 9:00-12:00) - 3h
**Goal**: Risk-benefit visualization, AHA vs ESC comparison

**Priority**: P1 (Differentiator)

| Task ID | Task | Dependencies | Estimated | Owner |
|---------|------|-------------|-----------|-------|
| P-01 | Pictograph component (100-person icon grid 10x10) | F-02 | 45min | AI Agent |
| P-02 | SGLT2i HFrEF data (DAPA-HF + EMPEROR-R) | F-03 | 20min | AI Agent + MD Review |
| P-03 | Pictograph integration with Case 1 | P-01, P-02 | 20min | AI Agent |
| M-01 | Multi-guideline comparison data (AHA vs ESC) | F-03 | 30min | AI Agent + MD Review |
| M-02 | Side-by-side guideline display component | M-01 | 30min | AI Agent |
| M-03 | Known differences highlighting | M-01 | 20min | AI Agent |
| C2-01 | Case 2 test data (75F HFpEF EF58%) | F-03 | 20min | AI Agent + MD Review |
| C2-02 | HFpEF Management Score logic | E-05 | 30min | AI Agent (TDD) |
| C2-03 | Case 2 integration test | C2-01, C2-02 | 20min | AI Agent |

**Completion Criteria**:
- Pictograph renders correctly (SGLT2i only, Case 1)
- AHA vs ESC differences displayed side-by-side
- Case 2 (HFpEF) produces correct audit output
- HFpEF score calculated correctly

---

### Phase 5: Complex Case + LLM (Day 2, 13:00-15:30) - 2.5h
**Goal**: Case 3 (appropriate non-escalation), Claude API integration

**Priority**: P1/P2

| Task ID | Task | Dependencies | Estimated | Owner |
|---------|------|-------------|-----------|-------|
| C3-01 | Case 3 test data (72M HFrEF EF25%, multi-blocker) | F-03 | 20min | AI Agent + MD Review |
| C3-02 | "Appropriate non-escalation" logic | E-04 | 30min | AI Agent (TDD) |
| C3-03 | Case 3 integration test | C3-01, C3-02 | 20min | AI Agent |
| L-01 | Claude API integration (abstracted codes only) | F-02 | 30min | AI Agent |
| L-02 | LLM explanation layer (pillar narratives) | L-01 | 30min | AI Agent |
| L-03 | PHI isolation test (no patient values in API calls) | L-01, L-02 | 20min | AI Agent + Security |
| L-04 | LLM fallback (graceful degradation if API fails) | L-01 | 15min | AI Agent |

**Completion Criteria**:
- Case 3 correctly identifies appropriate non-escalation
- Claude API receives only abstracted status codes
- LLM generates readable explanations
- System works without LLM (graceful degradation)

---

### Phase 6: Polish + Deploy (Day 2, 15:30-19:00) - 3.5h
**Goal**: Export, final safety audit, deployment, demo prep

**Priority**: P1/P2

| Task ID | Task | Dependencies | Estimated | Owner |
|---------|------|-------------|-----------|-------|
| X-01 | SOAP-style export | All engine tasks | 30min | AI Agent |
| X-02 | Problem-list export | All engine tasks | 20min | AI Agent |
| X-03 | Raw JSON export | All engine tasks | 10min | AI Agent |
| X-04 | Draft watermark on all exports | X-01~X-03 | 10min | AI Agent |
| SA-01 | Full safety UI audit | All UI tasks | 30min | AI Agent + MD Review |
| SA-02 | Security review (no PHI leakage) | All tasks | 20min | AI Agent (Security) |
| SA-03 | 32 synthetic test cases run | All engine tasks | 30min | AI Agent |
| D-01 | Vercel deployment | All tasks | 20min | AI Agent |
| D-02 | Production smoke test | D-01 | 15min | AI Agent + MD Review |
| DM-01 | Demo script preparation (5min pitch) | D-02 | 30min | AI Agent + MD |
| DM-02 | Demo rehearsal | DM-01 | 30min | MD Lead |

**Completion Criteria**:
- All 3 export formats work correctly
- Safety audit passes all 10 principles
- No PHI in any API call or export
- Vercel deployment accessible
- Demo script covers 7 pitch sections

---

## 2. Task Dependency Graph

```
Phase 0 (Foundation)
  F-01 ─┬─ F-04
        └─ F-05
  F-02 ─┬─ F-03
        ├─ E-01~E-07 (Phase 1)
        └─ U-01~U-05 (Phase 2)

Phase 1 (Rule Engine)
  E-01~E-07 ─── E-08 ─── E-09

Phase 2 (UI)
  U-01~U-05 + E-09 ─── U-06

Phase 3 (Inertia Buster + Safety)
  B-01~B-03 + S-01~S-05 ─── I-01

Phase 4 (Pictograph + Multi-guideline)
  P-01~P-03 (independent)
  M-01~M-03 (independent)
  C2-01~C2-03 (depends on E-05)

Phase 5 (Complex Case + LLM)
  C3-01~C3-03 (depends on E-04)
  L-01~L-04 (depends on F-02)

Phase 6 (Polish + Deploy)
  X-01~X-04 (depends on all engine)
  SA-01~SA-03 (depends on all)
  D-01~D-02, DM-01~DM-02 (final)
```

---

## 3. Role Assignment Matrix

### AI Agent Roles

| Agent | Responsibility | When Activated |
|-------|---------------|----------------|
| **planner** | Implementation planning, phase coordination | Project start, phase transitions |
| **architect** | System design decisions, pattern selection | Phase 0, architectural questions |
| **tdd-guide** | Write tests first, enforce TDD cycle | All engine tasks (E-*), C2-02, C3-02 |
| **code-reviewer** | Code quality, immutability, patterns | After each task completion |
| **security-reviewer** | PHI protection, API security, no secrets | L-03, SA-02, before deployment |
| **build-error-resolver** | Fix build/type errors | When build fails |
| **e2e-runner** | End-to-end testing | I-01, Phase 6 |
| **refactor-cleaner** | Dead code removal, consolidation | Phase 6 polish |
| **doc-updater** | Documentation maintenance | Phase 6 |

### Human (Yusuke Fukushima MD) Responsibilities

| Area | Specific Tasks | Phase |
|------|---------------|-------|
| **Ruleset Validation** | Verify ruleset_hf_gdmt_v2.json accuracy | Phase 0 (F-03) |
| **Clinical Logic Review** | Confirm EF thresholds, blocker codes, dose tiers | Phase 1 (E-08) |
| **Inertia Buster Content** | Review barrier-specific clinical information | Phase 3 (B-01, S-05) |
| **Pictograph Numbers** | Verify DAPA-HF + EMPEROR-R statistics | Phase 4 (P-02) |
| **Multi-guideline Accuracy** | Confirm AHA vs ESC differences | Phase 4 (M-01) |
| **Test Case Validation** | Review Case 1, 2, 3 expected outputs | Phase 1, 4, 5 |
| **Safety Language Audit** | Ensure no-blame language throughout | Phase 3 (S-05), Phase 6 (SA-01) |
| **Demo Lead** | Lead 5-minute pitch, handle clinical Q&A | Phase 6 (DM-01, DM-02) |

### Parallel Execution Opportunities

Independent tasks that can run simultaneously:

```
Phase 1: E-01 || E-06 || E-07 (then E-02, E-03, E-04 can partially overlap)
Phase 2: U-01 || U-03 || U-05 (independent components)
Phase 3: B-01 || S-01~S-04 (Inertia Buster content || Safety UI elements)
Phase 4: P-01~P-03 || M-01~M-03 || C2-01 (three independent tracks)
Phase 5: C3-01~C3-03 || L-01~L-04 (Case 3 || LLM integration)
Phase 6: X-01~X-03 || SA-01~SA-02 (exports || audits)
```

---

## 4. Risk Mitigation Plan

### Risk 1: Rule Engine Error
- **Probability**: HIGH (medical logic is complex)
- **Impact**: CRITICAL (incorrect clinical analysis)
- **Mitigation**:
  - TDD for every engine function (tdd-guide agent)
  - MD reviews all expected outputs before tests are written
  - 32 synthetic test cases with pre-validated expected results
  - Deterministic pure functions (no randomness, no side effects)
- **Trigger**: Any test failure in engine/ → stop and fix before proceeding

### Risk 2: Guideline Misrepresentation
- **Probability**: MEDIUM
- **Impact**: CRITICAL
- **Mitigation**:
  - Every guideline reference includes source DOI in ruleset
  - AHA 2022 vs ESC 2023 differences explicitly catalogued (v2.1 changelog)
  - HFpEF SGLT2i: AHA Class 2a / ESC Class I (v2.1 correction)
  - MD validates all guideline mappings in Phase 0
- **Trigger**: Any guideline class/LOE discrepancy → halt, consult MD

### Risk 3: LLM Hallucination
- **Probability**: HIGH
- **Impact**: MEDIUM (LLM is explanation layer only)
- **Mitigation**:
  - LLM receives ONLY abstracted status codes, never patient values
  - Rule engine is deterministic and LLM-independent
  - Graceful degradation: system works fully without LLM (L-04)
  - AI-generated content clearly labeled in UI (S-03)
  - LLM is P2 priority — skip entirely if time-constrained
- **Trigger**: LLM output contradicts rule engine → show rule engine result, flag LLM disclaimer

### Risk 4: "Dangerous AI" Perception
- **Probability**: MEDIUM
- **Impact**: HIGH (hackathon judges, medical community)
- **Mitigation**:
  - 6 mandatory safety UI elements (S-01~S-04, disclaimer, no-blame)
  - "DEMO MODE" badge persistent on every screen
  - "Synthetic data only" explicit declaration
  - Tool positions as "audit assistant" not "clinical decision maker"
  - Disclaimer: "Not a medical device. For educational demonstration only."
  - 10 Safety Principles documented and enforced
- **Trigger**: Any language suggesting autonomous decision → immediate fix

### Risk 5: Pictograph Numbers
- **Probability**: LOW (using published trial data)
- **Impact**: HIGH (misrepresenting clinical evidence)
- **Mitigation**:
  - Single pictograph only (SGLT2i HFrEF, Case 1)
  - Source: DAPA-HF + EMPEROR-R (specific DOIs in ruleset)
  - MD validates exact numbers before implementation
  - "Based on [trial name]. Individual results may vary." disclaimer
- **Trigger**: Any uncertainty about numbers → remove pictograph, show text only

### Risk 6: CLINICAL_INERTIA Accusatory Language
- **Probability**: LOW (v2.1 addressed this)
- **Impact**: HIGH (alienates physicians)
- **Mitigation**:
  - UI displays: "No identified blocker - Eligible to consider intensification"
  - NEVER displays "clinical inertia" to user
  - No-blame language audit in Phase 3 (S-05) and Phase 6 (SA-01)
  - Internal code may use CLINICAL_INERTIA as enum, but UI transforms it
- **Trigger**: Any occurrence of "clinical inertia" in user-facing text → immediate fix

### Risk 7: 2-Day Overscope
- **Probability**: HIGH (ambitious specification)
- **Impact**: MEDIUM (incomplete demo)
- **Mitigation**:
  - Strict P0/P1/P2 prioritization
  - Emergency MVP defined: HFrEF only, 4-pillar + blockers, Case 1 only
  - Phase gates: each phase has completion criteria before proceeding
  - Cut list (in priority order if behind schedule):
    1. Cut P2: LLM explanations, audit export, all-pillar Inertia Buster
    2. Cut P1 partial: Pictograph (show text instead), Case 3
    3. Emergency: Case 1 only, no multi-guideline
  - Time checkpoints: Day 1 12:00 (Phase 1 halfway), Day 1 17:00 (Phase 2 done), Day 2 12:00 (Phase 4 done)
- **Trigger**: >30min behind schedule at any checkpoint → evaluate cuts

### Risk 8: Claude API Limits
- **Probability**: LOW-MEDIUM
- **Impact**: LOW (LLM is optional layer)
- **Mitigation**:
  - LLM is P2 priority — system fully functional without it
  - Graceful degradation built into L-04
  - Cache LLM responses for demo scenarios
  - Rate limiting in API client
  - API key stored in environment variable only
- **Trigger**: API errors → fall back to rule-engine-only mode

---

## 5. Time Checkpoints & Decision Points

| Time | Checkpoint | Expected State | If Behind |
|------|-----------|---------------|-----------|
| Day 1 10:30 | Phase 0 Complete | Project scaffolded, types defined | Simplify type system |
| Day 1 12:00 | Phase 1 Midpoint | E-01~E-04 done, basic pillar evaluation | Drop E-06, E-07 to Phase 4 |
| Day 1 13:00 | Lunch Break | Phase 1 core complete, Case 1 passing | Prioritize E-05 (score) after lunch |
| Day 1 15:30 | Phase 1 Complete | All engine tests pass, Case 1 correct | Skip E-09, move to UI |
| Day 1 17:30 | Phase 2 Complete | Dashboard renders Case 1 | Simplify UI (2-pane instead of 3) |
| Day 1 20:00 | Day 1 End | Phase 3 complete, safety UI in place | Phase 3 becomes Day 2 morning |
| Day 2 10:30 | Phase 4 Midpoint | Pictograph or multi-guideline done | Drop pictograph, focus multi-guideline |
| Day 2 12:00 | Phase 4 Complete | Case 2 working, guideline comparison | Drop Case 2, keep multi-guideline display |
| Day 2 14:30 | Phase 5 Complete | Case 3 + LLM working | Drop LLM entirely (P2) |
| Day 2 17:00 | Phase 6 Midpoint | Deployed, exports working | Skip exports, focus on demo |
| Day 2 19:00 | FINAL | Demo ready | Emergency MVP + rehearsal |

---

## 6. Emergency MVP Definition

If severely behind schedule, the minimum viable demo:

**Scope**: HFrEF only, Case 1 only, no LLM, no exports

**Includes**:
- Patient input form (simplified)
- 4-pillar status cards with color coding
- GDMT Score display
- Blocker codes list
- DEMO MODE badge + disclaimer
- Static Inertia Buster text (no dynamic generation)

**Excludes**:
- HFpEF/HFmrEF support
- Case 2, Case 3
- Multi-guideline comparison
- Pictograph
- LLM explanations
- Export functionality
- Audit log

**Estimated time to Emergency MVP**: 8 hours (fits in Day 1 alone)

---

## 7. Development Principles

1. **TDD Mandatory**: Every engine function gets tests first (RED -> GREEN -> REFACTOR)
2. **Immutability**: No mutation. Spread operators, new objects always
3. **Pure Functions**: Engine has zero side effects, zero external dependencies
4. **Small Files**: 200-400 lines typical, 800 max
5. **PHI Protection**: No patient values leave the browser. LLM gets abstract codes only
6. **Safety First**: All 6 safety UI elements must be present before any demo
7. **Phase Gates**: Complete each phase's criteria before moving to next
8. **MD Review Points**: Marked tasks require domain expert validation before proceeding
9. **Parallel Execution**: Independent tasks run concurrently via parallel agents
10. **Graceful Degradation**: Every optional feature has a fallback (especially LLM)
