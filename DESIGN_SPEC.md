# Inertia Linter — Design Specification v2.1

**Clinical Inertia Auditor for Heart Failure GDMT**

> "Find why GDMT stalls. Break the inertia. Save the patient."

---

| Key | Value |
|-----|-------|
| Product | Inertia Linter |
| Version | v2.1 (Post Devil's Advocate Review ×2) |
| Concept | HF GDMT audit: detect clinical inertia, classify blockers, surface missing info, visualize risk-benefit |
| Hackathon | Cerebral Valley AI Hackathon |
| Theme | Build tools that should exist |
| Duration | 2 days (weekend) |
| Creator | Yusuke Fukushima MD (@Shimayuz) / quai inc. |
| Domain | Interventional Cardiologist, 20 years (Ischemic Heart Disease & Heart Failure) |
| Date | February 13, 2026 |

---

## Changelog: v2.0 → v2.1

| Category | Change | Reason |
|----------|--------|--------|
| CRITICAL | HFpEF SGLT2i: AHA Class 2a / ESC Class I (was incorrectly shown as both Class I) | Guideline accuracy is non-negotiable |
| CRITICAL | CLINICAL_INERTIA display label → "No identified blocker" | Avoids blaming physician; enables adoption |
| CRITICAL | Pictograph limited to 1 only (Case 1 SGLT2i) with full trial specs | Fewer numbers = fewer attack surfaces |
| HIGH | Demo Mode: synthetic-only explicitly defined | PHI compliance even at hackathon |
| HIGH | LLM receives only blocker codes + pillar status (no patient values) | PHI minimization by design |
| HIGH | eGFR thresholds split: initiation vs continuation | Clinical accuracy |
| HIGH | MVP definition added (HFrEF-only fallback) | 2-day de-risking |
| MEDIUM | GDMT Score calculation formula defined | Eliminates ambiguity in demo |
| MEDIUM | Dose Tier system (low/med/high) replaces exact dose matching | Regional/formulary independence |
| MEDIUM | Labs/Vitals timestamp added to Patient Snapshot | Data freshness affects decisions |
| MEDIUM | Reason input: multi-select + free-text + audit trail | Richer barrier capture |
| MEDIUM | Audit log export in SOAP/problem-list format | Demo wow-factor + practical value |
| MEDIUM | Ruleset versioning with guideline ID + DOI | Traceability for every rule |
| LOW | Inertia Buster: reframed as "information to consider" not "counter-arguments" | Avoids treatment-recommendation appearance |

---

## 1. Executive Summary

### 1.1 The Problem

Heart failure affects over 64 million people globally. GDMT consisting of four pillars (ARNI/ACEi/ARB, Beta-blockers, MRA, SGLT2i) dramatically reduces mortality and hospitalization. Yet GDMT optimization rates remain 30–50%. The gap is not knowledge but action: **clinical inertia**.

Clinical inertia manifests as: medications stopped after minor side effects and never restarted, doses left at initiation levels indefinitely, new evidence-based therapies never added, and the pervasive mindset of "the patient is stable, so why change anything." This is most acute among general internists managing heart failure patients outside cardiology clinics.

### 1.2 The Solution

Inertia Linter is a clinical inertia auditor. It does not prescribe. It does not decide. It audits the current state of therapy, classifies the reasons for therapeutic gaps, identifies missing information, and generates a structured report. The physician makes all decisions.

**One-liner:** *"Patient snapshot in. Inertia reasons out. Faster GDMT. Fewer deaths."*

### 1.3 What This Tool Will NEVER Do

| Will Never Do | Instead Does |
|---------------|-------------|
| Prescribe a specific drug or dose | Shows pillar status and available options (class-level, not agent-level) |
| Make autonomous treatment decisions | Presents structured information for physician review |
| Replace clinical judgment | Augments judgment by surfacing hidden blockers and missing data |
| Store or transmit patient health information | Session-only computation; synthetic data in demo mode |
| Generate treatment plans | Generates audit reports with blocker classifications |

### 1.4 Why Not a Claude Skill

| Dimension | Claude Skill | Inertia Linter |
|-----------|-------------|----------------|
| Core logic | Prompt-based | Deterministic rule engine (Guideline-as-Code) |
| Testability | None | 32+ synthetic cases with expected outputs, CI-tested |
| Accountability | No audit trail | Structured audit log with blocker codes + timestamps |
| Reproducibility | LLM variance | Identical input = identical output (deterministic core) |
| Safety | No classification | Pillar status + blocker codes + missing info |

---

## 2. Product Definition

### 2.1 Positioning

| Attribute | Definition |
|-----------|-----------|
| Category | Clinical Decision Support (Audit/Lint Tool) |
| NOT | Prescription system, treatment recommender, autonomous agent, EHR |
| Target User | Non-cardiologist general internists managing HF outpatients |
| Regulatory | Educational/CDS. All outputs require physician review |
| Liability | Tool provides structured information only. Physician retains full clinical responsibility |
| Demo Mode | **SYNTHETIC DATA ONLY.** Real patient data input is disabled in hackathon build |

### 2.2 EF Category Coverage

| EF Category | GDMT Clarity | Coverage |
|-------------|-------------|----------|
| HFrEF (EF ≤ 40%) | High: 4 pillars well-established | Full pillar audit + dose tier check |
| HFmrEF (EF 41–49%) | Growing: evidence expanding | Pillar audit + emerging evidence flags |
| HFpEF (EF ≥ 50%) | Evolving: see guideline differences below | SGLT2i audit + finerenone opportunity + comorbidity |

### 2.3 Guideline Sources (Multi-Guideline Integration)

**CRITICAL DESIGN PRINCIPLE: When guidelines differ, both positions are displayed transparently. Inertia Linter never silently picks one over the other.**

| Source | Version | Role | Citation ID Format |
|--------|---------|------|--------------------|
| AHA/ACC/HFSA | 2022 Guideline + 2023 Expert Consensus | Primary HFrEF framework | AHA2022-xxx |
| ESC | 2021 + 2023 Focused Update + 2024 | Secondary: HFpEF nuance, finerenone | ESC2023-xxx |
| ACC ECDP | 2024 Expert Consensus Decision Pathway | SGLT2i specific guidance | ECDP2024-xxx |
| Key RCTs | DAPA-HF, EMPEROR-R/P, FINEARTS-HF, PARADIGM-HF, STRONG-HF | Evidence for pictograph + Inertia Buster | RCT-xxx |

#### 2.3.1 Known Guideline Differences (Explicitly Handled)

| Topic | AHA/ACC/HFSA 2022 | ESC 2021/2023 | Inertia Linter Display |
|-------|-------------------|---------------|----------------------|
| **SGLT2i in HFpEF** | Class 2a, LOE B (per AHA Take-Home summary) | Class I, LOE A (ESC 2023 Focused Update) | BOTH shown: "AHA: 2a / ESC: I-A" |
| **Finerenone in HFmrEF/HFpEF** | Not yet graded in formal guideline | Class IIa, LOE B (ESC 2024) | "ESC: IIa-B / AHA: Not yet graded" |
| **ARNI vs ACEi first-line** | Class I for ARNI (can use either) | Prefer ARNI over ACEi (stronger language) | Show both positions |
| **Rapid sequence initiation** | Not addressed in main GL | Supported by STRONG-HF | "ESC-supported (STRONG-HF) / AHA: not addressed" |

> **This table IS the product's differentiator.** No existing tool shows guideline differences side-by-side at point of care. This alone justifies Inertia Linter's existence.

---

## 3. System Architecture

### 3.1 Hybrid: Rule Engine + LLM (Strict Separation)

| Layer | Technology | Responsibility | Deterministic? | Receives Patient Data? |
|-------|-----------|---------------|----------------|----------------------|
| Rule Engine | TypeScript pure functions | Pillar status, blocker codes, missing info, GDMT score | Yes (100%) | Yes (client-side only) |
| LLM Explanation | Claude API (Sonnet) | Natural language rationale + guideline citation narrative | No (labeled as AI-generated) | **NO** (receives only: pillar status, blocker codes, guideline IDs) |
| Visualization | React + Recharts | Dashboard, pictograph, pillar cards | N/A | Client-side rendering only |
| Audit Log | JSON structured output | Complete record of input, output, actions | Yes (100%) | Client-side only; exportable |

**PHI Protection:** Patient numerical values (EF, BP, eGFR, K+) NEVER leave the client. The LLM receives only abstract status codes (e.g., `SGLT2i: MISSING, Blocker: ADR_HISTORY`). This is by design, not by accident.

### 3.2 Guideline-as-Code + Testing

| File | Content |
|------|---------|
| `ruleset_hf_gdmt_v2.json` | All rules as structured JSON. Each rule has: rule_id, guideline_id (AHA2022-xxx / ESC2023-xxx), class, LOE, conditions, thresholds, EF-specific logic, source DOI |
| `cases/*.json` | 32+ synthetic patient cases (all EF categories, common scenarios, edge cases) |
| `expected/*.json` | Expected output per case: pillar status, blocker codes, missing info, GDMT score |
| `test_runner.ts` | Automated regression: input → rule engine → compare to expected output |

Each rule carries a unique `guideline_id` and source DOI, enabling full traceability from UI back to original publication.

### 3.3 Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Recharts |
| Rule Engine | TypeScript pure functions (zero external dependencies) |
| LLM (explanation only) | Claude API (claude-sonnet-4-20250514) |
| Testing | Vitest (unit tests + synthetic case regression) |
| Build | Vite |
| Deploy | Vercel |

---

## 4. Core Features

### 4.1 Patient Snapshot (Minimal Input + Timestamps)

| Field | Type | Required? | If Missing |
|-------|------|-----------|-----------|
| EF (%) | number | Yes | Cannot classify EF category |
| NYHA Class | I/II/III/IV | Yes | Cannot assess severity |
| SBP (mmHg) | number | Yes | Cannot evaluate BP blockers |
| HR (bpm) | number | Yes | Cannot evaluate bradycardia |
| **Vitals date** | date | Recommended | If > 30 days: `STALE_VITALS` |
| eGFR (mL/min) | number | Recommended | `UNKNOWN_LABS` (renal) |
| K+ (mEq/L) | number | Recommended | `UNKNOWN_LABS` (potassium) |
| **Labs date** | date | Recommended | If > 14 days: `STALE_LABS` |
| BNP or NT-proBNP | number | Optional | Severity not quantified |
| DM Type | None/1/2 | Optional | Affects SGLT2i/finerenone context |
| Current Medications | structured list | Yes | Cannot audit GDMT |
| Each med: name + dose tier | string + low/med/high | Yes | Cannot assess optimization |

**v2.1 NEW:** Labs/Vitals timestamps. Stale data (labs > 14d, vitals > 30d) triggers `STALE_LABS` / `STALE_VITALS` blocker codes → "Obtain updated values" in Missing Info section.

### 4.2 Dose Tier System (Replaces Exact Dose Matching)

Instead of matching exact mg doses (which vary by region, formulary, and generic availability), Inertia Linter uses a 3-tier system:

| Tier | Definition | GDMT Score Points |
|------|-----------|-------------------|
| Not prescribed | Medication class absent | 0 |
| LOW | At or below initiation dose | 8 (of 25 per pillar) |
| MEDIUM | Above initiation but below target | 16 |
| HIGH (target) | At or near guideline target dose | 25 |

The physician self-reports the dose tier. This avoids the need for a complete drug database and respects regional formulary differences. The audit focuses on trajectory (is the dose moving toward target?) rather than absolute milligrams.

### 4.3 GDMT Score Calculation

GDMT Score provides a single number (0–100) representing overall optimization level.

#### HFrEF/HFmrEF (4 Pillars, 25 points each)

| Pillar | Not Rx'd | LOW | MEDIUM | HIGH | CONTRAINDICATED |
|--------|----------|-----|--------|------|-----------------|
| ARNI/ACEi/ARB | 0 | 8 | 16 | 25 | N/A (excluded, recalculate) |
| Beta-blocker | 0 | 8 | 16 | 25 | N/A |
| MRA | 0 | 8 | 16 | 25 | N/A |
| SGLT2i | 0 | 8 | 16 | 25 | N/A |

If a pillar is CONTRAINDICATED → excluded, score recalculated out of remaining maximum (e.g., 3 pillars = /75, normalized to 0–100). If UNKNOWN → score shows "XX/100 (incomplete data)*".

#### HFpEF (Modified Scoring)

HFpEF uses a separate scoring framework: "HFpEF Management Score." The 4-pillar model does not directly apply. Score reflects adherence to EF-specific recommendations: SGLT2i (primary), BP management, diuretic optimization, emerging therapies (finerenone). Displayed as a distinct metric to avoid conflation with HFrEF GDMT Score.

### 4.4 Pillar Status Classification

| Status | Badge Color | Meaning |
|--------|------------|---------|
| `ON_TARGET` | 🟢 Green | On medication at target tier (HIGH) |
| `UNDERDOSED` | 🟡 Amber | On medication but below target tier |
| `MISSING` | 🔴 Red | Not on medication despite potential indication |
| `CONTRAINDICATED` | ⚫ Gray | True contraindication documented |
| `UNKNOWN` | 🟣 Purple | Insufficient data to determine |

### 4.5 Blocker Code System

| Code (Internal) | UI Display Label | Category | Example |
|-----------------|-----------------|----------|---------|
| `BP_LOW` | Low blood pressure | Hemodynamic | SBP < 100 |
| `HR_LOW` | Low heart rate | Hemodynamic | HR < 60 |
| `K_HIGH` | Elevated potassium | Metabolic | K+ > 5.0 |
| `EGFR_LOW_INIT` | Renal function (initiation threshold) | Renal | eGFR < 30 for MRA initiation |
| `EGFR_LOW_CONT` | Renal function (continuation threshold) | Renal | eGFR < 20 for SGLT2i continuation |
| `RECENT_AKI` | Recent acute kidney injury | Renal | AKI within past 4 weeks |
| `ADR_HISTORY` | Previous adverse reaction | ADR | UTI with SGLT2i |
| `ALLERGY` | Drug allergy | ADR | Documented allergy to drug class |
| `STALE_LABS` | Lab values may be outdated | Data Gap | Labs > 14 days old |
| `STALE_VITALS` | Vital signs may be outdated | Data Gap | Vitals > 30 days old |
| `UNKNOWN_LABS` | Lab values not available | Data Gap | K+ not entered |
| `CLINICAL_INERTIA` | **"No identified blocker"** | Behavioral | No contraindication or data gap found |
| `PATIENT_REFUSAL` | Patient preference | Patient | Patient declined after shared decision |
| `COST_BARRIER` | Access/cost barrier | Access | Insurance/formulary issue |
| `OTHER` | Other (physician-documented) | Other | Free-text reason provided |

**v2.1 KEY CHANGE:** `CLINICAL_INERTIA` is NEVER shown to the user as "clinical inertia."

- **UI label:** "No identified blocker — Eligible to consider intensification"
- **Tooltip:** "No documented contraindication, data gap, or patient factor was found. If there is an undocumented reason, please add it below."
- Physician can override by adding a reason (free-text "Other")

**v2.1 NEW:** eGFR split into `EGFR_LOW_INIT` and `EGFR_LOW_CONT`. Initiation and continuation thresholds differ (e.g., SGLT2i: initiation may be limited at eGFR < 20–25 depending on agent/region; continuation may be allowed to lower values per ACC ECDP 2024).

### 4.6 Inertia Buster: Structured Information for Barrier Resolution

**v2.1 REFRAME:** Inertia Buster is NOT "counter-arguments." It is **"additional clinical information relevant to the stated barrier, for physician consideration."** This prevents the tool from appearing to recommend treatment.

#### 4.6.1 Reason Input (v2.1 Enhanced)

When a pillar is MISSING or UNDERDOSED, the physician documents the reason:

- **Multiple selection** supported (e.g., both "adverse reaction" and "cost barrier")
- **Predefined options** per pillar (mapped to blocker codes)
- **Free-text "Other"** always available
- **Editable** (reasons can be updated later)
- All selections recorded in audit log

#### 4.6.2 Information Provided per Barrier (SGLT2i Example)

| Stated Reason | Information Provided (for consideration, not as recommendation) |
|--------------|--------------------------------------------------------------|
| UTI with SGLT2i | Published re-challenge data and outcomes. Absolute risk differences from landmark trials. Risk-benefit pictograph (see Section 4.7). Practical options: same agent + hygiene counseling, switch to alternative SGLT2i. When NOT to re-challenge: recurrent/severe UTI, pyelonephritis, Fournier's gangrene. |
| Genital mycotic infection | Incidence data (2–5% in trials, mostly mild). Management strategies available in literature. Alternative agent consideration. |
| Hypotension | SGLT2i BP-lowering effect is modest (~3–4 mmHg in trials). Consider diuretic dose adjustment as contributing factor. Volume status assessment may clarify. |
| eGFR concern | Distinguish initiation vs continuation thresholds. Initial eGFR dip is expected and typically reversible. Renoprotective benefit data across eGFR ranges. ACC ECDP 2024 provides agent-specific guidance. |
| Never considered | This is an information gap, not a clinical blocker. Class I (ESC) / Class 2a (AHA) for HFrEF/HFpEF. No titration required. Fixed dose. Blocker code: CLINICAL_INERTIA (displayed as "No identified blocker"). |

#### 4.6.3 Full Pillar Coverage (Summary)

| Pillar | Common Barriers Addressed |
|--------|--------------------------|
| ARNI/ACEi/ARB | ACEi cough (ARB/ARNI different mechanism), low BP (start low/reduce diuretic), cost (generic ARB bridge), ACEi→ARNI washout (36h defined) |
| Beta-blocker | Bradycardia (target HR > 60), fatigue (often transient), COPD/asthma (beta-1 selective), acute decompensation (do not initiate; do not stop) |
| MRA | Hyperkalemia fear (K+ < 5.0 safe), renal concern (eGFR > 30 for spironolactone), gynecomastia (eplerenone), HFpEF (finerenone: ESC IIa) |
| SGLT2i | (Detailed above) |

### 4.7 Risk-Benefit Pictograph (Single, Fully Specified)

**v2.1 SCOPE REDUCTION:** Only ONE pictograph for hackathon: SGLT2i benefit (HF hospitalization) vs infection concern, for Case 1 (HFrEF). Single pictograph reduces attack surface while maximizing demo impact.

#### Pictograph Specification

| Parameter | Specification |
|-----------|--------------|
| Comparison | SGLT2i in HFrEF: HF hospitalization prevented vs urogenital infection |
| Benefit source | DAPA-HF (dapagliflozin) + EMPEROR-Reduced (empagliflozin) |
| Benefit outcome | Composite of worsening HF event or CV death |
| Harm outcome | Urogenital infection (composite: UTI + genital mycotic) |
| Time horizon | Median follow-up ~18 months (DAPA-HF: 18.2m, EMPEROR-R: 16m) |
| Population | HFrEF (EF ≤ 40%), NYHA II–IV, with/without diabetes |
| How "per 100" is derived | Absolute risk reduction (ARR) from trial data, rounded to nearest integer |
| Display | 100 person icons (10×10 grid). Green = benefit. Red = harm. Gray = unaffected |
| Mandatory disclaimer | "Based on average trial populations over ~18 months. Individual risk varies. This visualization is for educational purposes." |
| Known limitation | UTI increase with SGLT2i was not statistically significant in all trials. Pictograph notes: "infection risk was small and inconsistent across studies." |

> **Exact numbers will be validated by Yuz (domain expert) against published trial data before implementation.**

### 4.8 Structured Audit Report

| Section | Content | Deterministic? |
|---------|---------|---------------|
| Patient Snapshot | Input data as entered (frozen, timestamped) | Yes |
| EF Category | HFrEF / HFmrEF / HFpEF | Yes |
| GDMT Score | XX/100 (or HFpEF Management Score) | Yes |
| Pillar Status (×4) | ON_TARGET / UNDERDOSED / MISSING / CONTRAINDICATED / UNKNOWN | Yes |
| Blocker Codes | Per pillar: one or more codes with UI labels | Yes |
| Stated Reasons | Physician-selected reasons + free-text (audit-logged) | Yes (input) |
| Missing Information | What data would change the assessment | Yes |
| Next Best Questions | Prioritized: what to ask/order next | Yes |
| Inertia Buster Results | Information relevant to stated barriers | Hybrid |
| Guideline References | Multi-guideline with class/LOE + guideline ID + DOI | Yes |
| Monitoring Template | Follow-up schedule if changes are made | Yes |
| Audit Log | Complete: timestamp, input, output, physician actions, edits | Yes |

#### 4.8.1 Export Formats (v2.1 NEW)

One-click export as:

- **SOAP-style note** — structured clinical documentation format
- **Problem-list style** — bulleted summary of findings and next steps
- **Raw JSON** — for integration or archival

All exports use synthetic data in demo mode. Export is a demo highlight: showing audit results are immediately usable in clinical documentation.

---

## 5. Demo: 3 Cases

### 5.1 Case 1: HFrEF + Clinical Inertia + UTI Barrier

| Field | Value |
|-------|-------|
| Patient | 68M, post-MI (synthetic) |
| EF | 30% (HFrEF) |
| NYHA | II |
| SBP | 118 mmHg |
| HR | 68 bpm |
| eGFR | 55 (dated today) |
| K+ | 4.2 (dated today) |
| BNP | 450 |
| Meds | Enalapril LOW, Carvedilol MEDIUM |
| History | SGLT2i stopped 3 months ago (UTI) |

**Expected Output:**

| Pillar | Status | Blocker | UI Display |
|--------|--------|---------|-----------|
| ARNI/ACEi/ARB | UNDERDOSED | CLINICAL_INERTIA | "No identified blocker. Eligible to consider intensification." |
| Beta-blocker | UNDERDOSED | CLINICAL_INERTIA | "No identified blocker. HR and BP allow uptitration." |
| MRA | MISSING | CLINICAL_INERTIA | "No identified blocker. All criteria for initiation appear met." |
| SGLT2i | MISSING | ADR_HISTORY (UTI) | "Previous adverse reaction: UTI. See additional information." |

**GDMT Score: 24/100.** Demo highlight: Inertia Buster for SGLT2i shows re-challenge information + 100-person pictograph. Three pillars flagged as "No identified blocker" making inertia visible without blame.

### 5.2 Case 2: HFpEF + Multi-Guideline Differences + Finerenone

| Field | Value |
|-------|-------|
| Patient | 75F, hypertensive HD, T2DM (synthetic) |
| EF | 58% (HFpEF) |
| NYHA | II–III |
| SBP | 142 mmHg |
| HR | 78 bpm |
| eGFR | 45 (dated today) |
| K+ | 4.6 (dated today) |
| BNP | 280 |
| HbA1c | 7.2 |
| Meds | Amlodipine 5mg, Furosemide 20mg, Metformin |

**Expected Output:**

| Item | Status | Guideline Display |
|------|--------|------------------|
| SGLT2i | MISSING | **"AHA/ACC: Class 2a, LOE B \| ESC: Class I, LOE A"** (BOTH shown, difference highlighted) |
| Finerenone | OPPORTUNITY | **"ESC: Class IIa, LOE B (FINEARTS-HF) \| AHA: Not yet graded"** (new evidence flagged) |
| BP Control | SUBOPTIMAL | "SBP 142. Guideline target < 130 mmHg." |
| Diuretic | NEEDS REVIEW | "Congestion assessment recommended." |

**v2.1 CRITICAL FIX:** SGLT2i in HFpEF is now correctly shown as AHA Class 2a / ESC Class I. This difference IS the demo highlight for Case 2. *"Inertia Linter doesn't hide disagreements between guidelines. It shows them."*

### 5.3 Case 3: HFrEF Severe + Multiple Blockers ("Appropriate Non-Escalation")

| Field | Value |
|-------|-------|
| Patient | 72M, DCM (synthetic) |
| EF | 25% (HFrEF) |
| NYHA | III |
| SBP | 92 mmHg |
| HR | 72 bpm |
| eGFR | 28 (dated today) |
| K+ | 5.3 (dated today) |
| BNP | 1200 |
| Meds | ARNI LOW, Carvedilol LOW, Spironolactone LOW, Dapagliflozin (fixed dose) |

**Expected Output:**

| Pillar | Status | Blocker | Note |
|--------|--------|---------|------|
| ARNI | UNDERDOSED | BP_LOW | SBP 92. Uptitration not safe at this time |
| Beta-blocker | UNDERDOSED | BP_LOW | SBP 92. Uptitration not safe at this time |
| MRA | ON_TARGET (with alert) | K_HIGH | K+ 5.3. Consider dose reduction. Recheck in 1 week |
| SGLT2i | ON_TARGET | None | Fixed dose. Can continue (eGFR 28 > continuation threshold) |

**GDMT Score: 41/100** (low, but blockers are real).

Demo highlight: *"All 4 pillars on board. Doses are low but blockers are physiologically justified. GDMT optimization does not mean maximum dose. This patient has achieved maximum tolerated therapy. Not escalating IS the correct clinical decision."*

---

## 6. UI Design

### 6.1 3-Pane Dashboard

| Pane | Content | Width |
|------|---------|-------|
| Left | Patient Snapshot (input form with timestamps, dose tiers) | 25% |
| Center | Pillar Status Cards (4 cards with status/blocker badges) + GDMT Score | 45% |
| Right | Detail Panel (Inertia Buster info, pictograph, questions, export, audit log) | 30% |

### 6.2 Safety UI (Non-Negotiable Elements)

| Element | Location | Content |
|---------|----------|---------|
| Mode indicator | Top-left corner (always visible) | **"DEMO MODE — SYNTHETIC DATA ONLY"** (yellow badge) |
| Disclaimer banner | Top of every screen (sticky) | "Clinical audit tool. All outputs require physician review. Not treatment recommendations." |
| AI-generated label | On all LLM text | "This explanation is AI-generated." |
| Rule-derived label | On all rule engine output | "Derived from Guideline-as-Code ruleset v2 (testable, deterministic)." |
| Draft watermark | All report sections | "DRAFT — Pending physician review" |
| No-blame language | CLINICAL_INERTIA displays | "No identified blocker" (never "clinical inertia") |

---

## 7. Pitch Structure (5 minutes)

| # | Section | Time | Script |
|---|---------|------|--------|
| 1 | HOOK | 30s | "50% of HF patients don't receive optimal therapy. The drugs exist. The guidelines exist. Why? Clinical inertia. Barriers are invisible. I built a tool to make them visible." |
| 2 | WHO | 20s | "Interventional cardiologist. 20 years. I've seen patients readmitted because therapy was 'good enough.' General internists want to do better but lack structured support." |
| 3 | CASE 1 | 60s | Enter data. GDMT 24/100. Three pillars: "No identified blocker." SGLT2i: UTI barrier. Inertia Buster: information + pictograph. "The benefit is visible. The risk is visible. The physician decides." |
| 4 | CASE 2 | 50s | Enter data. SGLT2i missing. "AHA says 2a. ESC says Class I. Both are shown. No hidden preference." Finerenone: "ESC IIa, AHA not yet graded. Latest evidence, transparently presented." |
| 5 | CASE 3 | 40s | Enter data. All 4 pillars on board. All underdosed. Real blockers. "GDMT optimization ≠ maximum dose. This patient is appropriately managed. The tool confirms it." |
| 6 | ARCH | 20s | "Deterministic rule engine. 32 test cases in CI. LLM explains, never decides. Guideline-as-code, not guideline-as-prompt." |
| 7 | CLOSE | 20s | "Heart failure kills. Clinical inertia lets it. Inertia Linter makes barriers visible, gives physicians information to break them, and confirms when staying the course is right." |

---

## 8. 2-Day Development Plan

### 8.1 MVP Definition (Must-Have for Demo)

| Priority | Feature | Fallback if Time Runs Out |
|----------|---------|--------------------------|
| **P0 (must)** | Rule engine: HFrEF 4-pillar status + blocker codes | No fallback. This IS the product |
| **P0 (must)** | Patient snapshot input form (minimal fields) | No fallback |
| **P0 (must)** | Pillar status dashboard (4 cards with colors) | No fallback |
| **P0 (must)** | GDMT Score display | Show score without breakdown |
| P1 (should) | Inertia Buster for SGLT2i (UTI barrier) | Static text instead of interactive |
| P1 (should) | 100-person pictograph (SGLT2i only) | Show numbers as text |
| P1 (should) | Multi-guideline display (Case 2 HFpEF) | Single guideline only |
| P1 (should) | Case 3 output (appropriate non-escalation) | Describe verbally |
| P2 (nice) | LLM explanations with citations | Pre-written template text |
| P2 (nice) | Audit log export (SOAP format) | Show raw JSON |
| P2 (nice) | Inertia Buster for all 4 pillars | SGLT2i only; mention others verbally |
| P2 (nice) | 32 synthetic test cases in CI | 12 core cases (3 per EF + 3 edge) |

**Emergency MVP (absolute minimum):** HFrEF only. 4-pillar status + blocker codes. Case 1 only. No LLM, no pictograph, no multi-guideline. This alone demonstrates: *"I can detect where GDMT has stalled and why."* Still wins if executed well.

### 8.2 Day 1: Foundation

| Time | Task | Done When |
|------|------|-----------|
| 9:00–10:30 | Project setup: Vite + React + TS + Tailwind + folder structure | Dev server running with scaffold |
| 10:30–13:00 | Rule engine: all EF categories, 4-pillar evaluation, blocker codes, GDMT score | Case 1 returns correct output programmatically |
| 13:00–14:00 | Lunch | — |
| 14:00–15:30 | Synthetic test cases: 12 core cases + test runner | All 12 tests green |
| 15:30–17:30 | UI: Patient input form + 4-pillar dashboard (center pane) | Case 1 data entered, pillar cards display correctly |
| 17:30–19:00 | Inertia Buster: SGLT2i reason selector + information display | UTI selected, re-challenge info appears |
| 19:00–20:00 | Day 1 integration test: full Case 1 flow end-to-end | Case 1 works completely |

### 8.3 Day 2: Polish + Impact

| Time | Task | Done When |
|------|------|-----------|
| 9:00–10:30 | Pictograph component (SGLT2i, single instance) + animation | Green/red icons render with correct counts |
| 10:30–12:00 | Case 2: HFpEF rules + multi-guideline display (AHA 2a / ESC I) | Case 2 shows guideline differences |
| 12:00–13:00 | Lunch | — |
| 13:00–14:30 | Case 3: blocker visualization + "appropriate non-escalation" output | Case 3 shows BP_LOW, K_HIGH, confirms current therapy |
| 14:30–15:30 | LLM integration (explanation layer) + AI-generated labels | Explanations appear with citations |
| 15:30–16:30 | Safety UI: all disclaimers, demo mode badge, draft watermarks | Every safety element visible |
| 16:30–17:30 | Audit log export (SOAP format) + polish | Export button works |
| 17:30–18:30 | Demo rehearsal + deploy to Vercel + final fixes | 3 cases flow in 2.5 minutes |
| 18:30–19:00 | Buffer | Demo ready |

---

## 9. Risk Management

| Risk | Impact | Prob | Mitigation |
|------|--------|------|-----------|
| Rule engine error (wrong pillar status) | Critical | Med | 12–32 synthetic tests with regression. Domain expert validates |
| Guideline misrepresentation | Critical | Med | Every rule has guideline_id + DOI. Differences shown, never hidden |
| LLM hallucination in explanations | High | Med | LLM is explanation-only. Never decides. Receives no patient data. AI-generated label |
| "Dangerous medical AI" perception | High | Med | Audit tool positioning. Safety UI everywhere. "Will never do" table. Demo Mode |
| Pictograph numbers challenged | High | Low | Single pictograph, fully specified (trial, population, time horizon, disclaimer) |
| CLINICAL_INERTIA feels accusatory | Med | Med | Display as "No identified blocker." Free-text override available |
| 2-day overscope | High | Med | MVP defined: Case 1 HFrEF only is sufficient. Everything else is additive |
| Claude API limits during demo | Med | Low | Pre-cache LLM responses for demo cases. Template fallback |

---

## 10. Differentiation

### 10.1 vs Existing Tools

| Tool | Does | Misses |
|------|------|--------|
| UpToDate | Guideline reference | No patient audit, no inertia detection, no barrier classification |
| Epic BPA | Pop-up alerts | Alert fatigue, no reasoning, no structured report |
| ChatGPT/Claude | General Q&A | No deterministic rules, no audit trail, no safety classification |
| AHA Risk Calculators | Risk estimation | No GDMT audit, no barrier identification |

### 10.2 Unique Propositions

1. First tool to classify WHY GDMT is stalled (15 blocker codes)
2. Inertia Buster: structured information per barrier (not generic advice)
3. Multi-guideline transparency (AHA vs ESC side-by-side, differences highlighted)
4. Guideline-as-Code: testable, versioned, traceable rules (not prompts)
5. 100-person pictograph: instant risk-benefit comprehension
6. "Not escalating is correct" validation (Case 3)
7. Non-blaming design: "No identified blocker" instead of "clinical inertia"
8. Built by a practicing cardiologist who has lived this problem for 20 years

### 10.3 Scalability

The architecture (rule engine + blocker codes + inertia detection + barrier-specific information) is domain-agnostic. Future: diabetes GDMT, hypertension, CKD, anticoagulation — any domain where therapeutic inertia is documented. The hackathon proves heart failure. The architecture proves it scales.

---

## 11. Safety & Ethics

| Principle | Implementation |
|-----------|---------------|
| No autonomous decisions | All outputs are draft. Physician reviews, edits, and confirms |
| Deterministic core | Clinical logic is rule-based and regression-tested |
| LLM isolation | LLM receives zero patient data. Only abstract status codes and guideline IDs |
| Transparency | Every rule traceable to guideline + DOI. Every output labeled (rule-derived or AI-generated) |
| Non-blaming | Never displays "clinical inertia" to user. Uses "No identified blocker" with override option |
| Multi-guideline honesty | Differences shown, never hidden. No silent preference |
| Data protection | Demo Mode: synthetic only. No PHI stored. Client-side computation |
| Appropriate uncertainty | UNKNOWN and STALE statuses are prominent outputs, not errors |
| Audit trail | Complete log of every interaction, exportable |
| Human-in-the-loop | Physician selects reasons, reviews output, edits freely. Tool never acts |

---

*Built by a cardiologist who has seen inertia cost lives.*
*Powered by rules, not guesses. Transparent, not persuasive.*
