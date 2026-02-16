# Inertia Linter

**A clinical inertia auditor that detects where chronic disease treatment has stalled, resolves barriers in 30 seconds instead of 30 minutes -- without ever sending patient data to an LLM.**

Built by [Yusuke Fukushima, MD (@shimayuz)](https://x.com/shimayuz) | Cerebral Valley AI Hackathon 2026

---

## The Problem

Clinical inertia -- the failure to intensify therapy when treatment goals aren't met -- affects every chronic disease. Only **1%** of eligible heart failure patients receive all four guideline-directed drug classes at target dose ([CHAMP-HF, JACC 2018](https://doi.org/10.1016/j.jacc.2018.04.070)). **6.7 million** HF patients in the US alone ([HFSA 2024](https://doi.org/10.1016/j.cardfail.2024.01.001)). Over **70% mortality reduction** is achievable with full optimization ([Vaduganathan et al., LANCET 2020](https://doi.org/10.1016/S0140-6736(20)30748-0)).

The guidelines exist. The drugs exist. The patient is sitting right there. And nothing changes.

## What It Does

### Detection

One click runs a full audit across multiple disease domains:

- **Heart Failure (HF-GDMT)**: 4-pillar analysis (ARNI/ACEi/ARB, Beta-blocker, MRA, SGLT2i) with GDMT Optimization Score (0-100)
- **Diabetes Management (DM)**: HbA1c target tracking, SGLT2i/GLP-1 RA gap detection
- **Hypertension Control (HTN)**: BP target compliance, medication class coverage

Each pillar is classified as `ON_TARGET`, `UNDERDOSED`, `MISSING`, or `CONTRAINDICATED`, with 15 blocker codes explaining *why* treatment has stalled. When the engine finds "No identified blocker -- eligible to consider intensification," that's where clinical inertia hides.

### Resolution

Detection alone doesn't save patients. The Resolution Layer turns findings into action:

- **PA forms auto-generated** with ICD-10 codes, clinical data, and guideline citations
- **Bridge prescriptions** to maintain therapy while prior authorizations process
- **Generic switches** that drop copays from $85/month to $4/month

Traditional workflow: 30 minutes of phone calls and fax machines. Inertia Linter: **30 seconds**.

### Multi-Guideline Transparency

When AHA and ESC guidelines disagree (e.g., SGLT2i in HFpEF: AHA Class 2a vs ESC Class I), both positions are displayed side-by-side. The tool never silently picks one.

---

## Architecture

```
+-------------------+     Abstract codes only     +-------------------+
|   Rule Engine     | --------------------------> |   Opus 4.6        |
|   (TypeScript)    |   "SGLT2i: MISSING,        |   Explanation     |
|                   |    Blocker: ADR_HISTORY"    |   Layer           |
|   Deterministic   |                             |   (NO patient     |
|   Pure functions  |   Patient data NEVER        |    data)          |
|   Zero side       |   crosses this boundary     |                   |
|   effects         |                             |   Translator,     |
+-------------------+                             |   not decision-   |
        |                                         |   maker           |
        v                                         +-------------------+
+-------------------+
|   Resolution      |
|   Layer           |
|   PA forms,       |
|   bridge Rx,      |
|   generics        |
+-------------------+
```

**PHI protection isn't a policy -- it's an architectural constraint.** Patient numerical values (EF, BP, eGFR, K+, HbA1c) never leave the client. The LLM receives only abstract status codes.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) to see the dashboard.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (localhost:5173) |
| `npm run build` | Production build |
| `npm run test` | Run all 496 Vitest tests |
| `npx vitest run src/engine/` | Engine tests only |
| `npx vitest run --coverage` | Coverage report (92% statements) |
| `npx tsc --noEmit` | Type check without emitting |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.9, Tailwind 4.1, Recharts 3.7 |
| Rule Engine | Pure TypeScript functions (zero external dependencies) |
| LLM (explanation) | Claude Opus 4.6 -- receives NO patient data |
| Validation | Zod 4.3 |
| Testing | Vitest 4.0 (496 tests, 92% statement coverage) |
| Build | Vite 7.3 |
| i18n | English + Japanese |
| Interop | FHIR-ready (CarePlan export) |

## Project Structure

```
src/
  types/          # Type definitions (PatientSnapshot, PillarStatus, BlockerCode, etc.)
  engine/         # Deterministic rule engine -- pure functions, zero side effects
    __tests__/    # 496 tests (TDD: RED -> GREEN -> REFACTOR)
  domains/        # Domain-specific engines (HF-GDMT, DM, HTN, ACS)
  data/           # Rulesets, synthetic cases, target doses
  components/     # React UI (3-pane clinician dashboard + patient view)
  hooks/          # Custom React hooks
  i18n/           # Internationalization (EN/JA)
  fhir/           # FHIR resource types
```

---

## How Opus 4.6 Is Used

### Runtime: Translator, not decision-maker

- Receives abstract audit output (pillar statuses + blocker codes + guideline IDs) -- **never patient data**
- Generates natural language clinical explanations
- Cites specific guidelines and landmark trials (DAPA-HF, EMPEROR-Preserved, DELIVER)
- Every output labeled as "AI-generated" vs "Rule-derived"

### Development: 12 specialized agents

The entire product was built with Claude Code + Opus 4.6 using **12 specialized agents**:

| Agent | Purpose |
|-------|---------|
| phi-guardian | Detects patient data patterns near API calls |
| engine-validator | Ensures pure functions, zero side effects |
| safety-language-auditor | Flags accusatory language in UI code |
| guideline-checker | Verifies AHA vs ESC accuracy + DOI traceability |
| tdd-guide | Enforces test-first development |
| code-reviewer | Post-write quality checks |
| security-reviewer | OWASP Top 10 scanning |
| build-error-resolver | Fixes TypeScript/build errors |
| + 4 more | Architecture, refactoring, docs, E2E |

---

## Safety Constraints

1. `CLINICAL_INERTIA` is **never** displayed to users -- UI shows "No identified blocker -- Eligible to consider intensification"
2. DEMO MODE badge persistent on every screen
3. Disclaimer banner sticky on every screen
4. AI-generated vs Rule-derived labels on all outputs
5. Draft watermark on all report sections
6. Multi-guideline transparency -- both AHA and ESC positions shown when they differ

---

## Demo Cases (Synthetic Data)

| Case | Patient | Domain | Key Finding |
|------|---------|--------|-------------|
| 1 | Akiko Sato, 52F | DM | HbA1c 8.5%, SGLT2i + GLP-1 RA missing, Score 24/100 |
| 2 | Taro Kobayashi, 58M | HTN | BP 162/98, ACEi underdosed, Score 31/100 |
| 3 | Kenji Yamamoto, 72M | HF | EF 25%, real blockers (BP_LOW, K_HIGH), Score 49/100 -- appropriate non-escalation |
| 4 | Sachiko Watanabe, 82F | HF | Post-discharge, PA barrier + cost barrier, Resolution: 33 -> 58 |

---

## Guideline Sources

| Source | Role |
|--------|------|
| AHA/ACC/HFSA 2022 + 2023 | Primary HFrEF framework |
| ESC 2021 + 2023 + 2024 | HFpEF nuance, finerenone |
| ACC ECDP 2024 | SGLT2i specific guidance |

Every rule in the engine carries `guideline_id` and source DOI for full traceability.

---

## License

This project was built for the Cerebral Valley AI Hackathon (February 2026). License TBD.

## Author

**Yusuke Fukushima, MD** ([@shimayuz](https://x.com/shimayuz))
Interventional Cardiologist | 20 years of clinical experience in Japan

*Powered by Claude Opus 4.6*
