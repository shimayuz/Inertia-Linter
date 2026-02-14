# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inertia Linter is a clinical inertia auditor for Heart Failure GDMT (Guideline-Directed Medical Therapy). It detects where GDMT has stalled, classifies blockers, surfaces missing information, and generates structured audit reports. **It does NOT prescribe or recommend treatments.**

Built for the Cerebral Valley AI Hackathon (Feb 2026) by Yusuke Fukushima MD.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Recharts
- **Rule Engine**: TypeScript pure functions (zero external dependencies)
- **LLM (explanation only)**: Claude API (claude-sonnet-4-20250514) — receives NO patient data
- **Testing**: Vitest
- **Build**: Vite
- **Deploy**: Vercel
- **Validation**: Zod (form input)

## Commands

```bash
npm run dev          # Dev server (localhost:5173)
npm run build        # Production build
npm run test         # Run all Vitest tests
npx vitest run src/engine/  # Run engine tests only
npx vitest run --coverage   # Run with coverage report (target: 80%+)
npx tsc --noEmit     # Type check without emitting
```

## Self-Verification (run after every significant change)

```bash
npx tsc --noEmit && npm run test && npm run build
```

## Project Commands (slash commands)

| Command | Purpose |
|---------|---------|
| `/interview` | Spec deep-dive: interactively resolve ambiguities in DESIGN_SPEC.md |
| `/build-critique` | Build & critique loop: verify build, visual audit, iterate until pass |
| `/safety-audit` | Full safety audit against 10 Safety Principles |
| `/validate-case [1,2,3,all]` | Run demo case through engine, compare to expected output |
| `/phi-check` | Scan codebase for PHI leakage risks |

## Architecture: Hybrid Rule Engine + LLM (Strict Separation)

| Layer | Responsibility | Deterministic? | Receives Patient Data? |
|-------|---------------|----------------|----------------------|
| Rule Engine (TypeScript pure functions) | Pillar status, blocker codes, missing info, GDMT score | Yes | Yes (client-side only) |
| LLM Explanation (Claude API) | Natural language rationale + guideline citations | No | **NO** — receives only abstract status codes |
| Visualization (React + Recharts) | Dashboard, pictograph, pillar cards | N/A | Client-side rendering only |

### PHI Protection (Non-Negotiable)

Patient numerical values (EF, BP, eGFR, K+) NEVER leave the client. The LLM receives only abstract status codes (e.g., `SGLT2i: MISSING, Blocker: ADR_HISTORY`).

### Expected Directory Structure

```
src/
  types/          # TypeScript type definitions (PatientSnapshot, PillarStatus, BlockerCode, etc.)
  engine/         # Deterministic rule engine — pure functions, zero side effects
  data/           # ruleset_hf_gdmt_v2.json, synthetic cases, expected outputs
  components/     # React UI components (3-pane dashboard)
  hooks/          # Custom React hooks
```

## Core Domain Rules

### EF Categories
- **HFrEF**: EF ≤ 40% — full 4-pillar audit (ARNI/ACEi/ARB, Beta-blocker, MRA, SGLT2i)
- **HFmrEF**: EF 41–49% — pillar audit + emerging evidence flags
- **HFpEF**: EF ≥ 50% — SGLT2i audit + finerenone opportunity + comorbidity (separate scoring)

### Pillar Statuses
`ON_TARGET` (green), `UNDERDOSED` (amber), `MISSING` (red), `CONTRAINDICATED` (gray), `UNKNOWN` (purple)

### Dose Tier System
Not prescribed (0pts), LOW (8pts), MEDIUM (16pts), HIGH/target (25pts) — per pillar, max 100 for HFrEF

### Blocker Codes (15 codes)
`BP_LOW`, `HR_LOW`, `K_HIGH`, `EGFR_LOW_INIT`, `EGFR_LOW_CONT`, `RECENT_AKI`, `ADR_HISTORY`, `ALLERGY`, `STALE_LABS`, `STALE_VITALS`, `UNKNOWN_LABS`, `CLINICAL_INERTIA`, `PATIENT_REFUSAL`, `COST_BARRIER`, `OTHER`

### eGFR Split
Initiation thresholds (`EGFR_LOW_INIT`) and continuation thresholds (`EGFR_LOW_CONT`) differ per drug class.

### Stale Data Detection
Labs > 14 days → `STALE_LABS`, Vitals > 30 days → `STALE_VITALS`

## Critical Safety Constraints

1. **`CLINICAL_INERTIA` is NEVER displayed to users as "clinical inertia"** — UI label must be "No identified blocker — Eligible to consider intensification"
2. **DEMO MODE badge** must be persistent on every screen with "SYNTHETIC DATA ONLY"
3. **Disclaimer banner** must be sticky on every screen
4. **AI-generated vs Rule-derived labels** must be on all outputs
5. **Draft watermark** on all report sections
6. **Multi-guideline transparency**: When AHA and ESC differ, BOTH positions must be shown (e.g., SGLT2i in HFpEF: "AHA: Class 2a / ESC: Class I")

## Multi-Guideline Sources

| Source | Role |
|--------|------|
| AHA/ACC/HFSA 2022 + 2023 | Primary HFrEF framework |
| ESC 2021 + 2023 + 2024 | HFpEF nuance, finerenone |
| ACC ECDP 2024 | SGLT2i specific guidance |

Every rule in `ruleset_hf_gdmt_v2.json` must carry `guideline_id` and source DOI for traceability.

## Engine Development Rules

- All engine functions must be **pure functions** — zero side effects, zero external dependencies
- All engine functions must follow **immutability** — never mutate input, always return new objects
- **TDD mandatory**: write tests first (RED), implement (GREEN), refactor
- GDMT Score: if a pillar is CONTRAINDICATED, exclude from denominator and normalize to 0–100
- HFpEF uses a separate "HFpEF Management Score" — do not conflate with HFrEF GDMT Score

## Demo Cases (3 Synthetic Patients)

- **Case 1**: 68M HFrEF EF 30% — clinical inertia + UTI barrier for SGLT2i -> GDMT 24/100
- **Case 2**: 75F HFpEF EF 58% — multi-guideline differences (AHA vs ESC) + finerenone opportunity
- **Case 3**: 72M HFrEF EF 25% — multiple real blockers (BP_LOW, K_HIGH) -> "appropriate non-escalation" -> GDMT 41/100

## Active Hooks (Project-Local)

- **PHI leak detector**: PostToolUse hook on engine/data/types `.ts` files — warns if patient data patterns appear near API call patterns
- **No-blame language check**: PostToolUse hook on components/hooks `.ts/.tsx` files — flags "clinical inertia" or accusatory language in UI code

## Development Workflow

1. **Plan first**: Use plan mode or `/interview` to resolve ambiguities before coding
2. **TDD**: Write failing test -> implement -> refactor (engine/ functions)
3. **Verify**: Run `npx tsc --noEmit && npm run test && npm run build` after changes
4. **Safety check**: Run `/safety-audit` and `/phi-check` before any demo or deployment
5. **Critique loop**: Run `/build-critique` for visual/functional QA with Playwright

## Key References

- [DESIGN_SPEC.md](DESIGN_SPEC.md) — Full product specification (v2.1)
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — 6-phase build plan with task IDs and dependencies
