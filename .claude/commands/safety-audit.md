# Safety Audit for Inertia Linter

Perform a comprehensive safety audit of the codebase against the 10 Safety Principles.

## Audit Checklist

### 1. No Autonomous Decisions
- Search for: imperative language ("should take", "must prescribe", "recommended dose")
- All outputs must be labeled as "draft" requiring physician review
- No treatment recommendations in any output

### 2. Deterministic Core
- Verify engine/ functions are pure (no side effects, no randomness)
- Run: `npx vitest run --reporter=verbose` and confirm all pass
- Check test coverage: `npx vitest run --coverage`

### 3. LLM Isolation (PHI Protection)
- Search ALL API call sites (fetch, axios, anthropic, claude)
- Verify ONLY abstract status codes are sent (pillar status, blocker codes, guideline IDs)
- NEVER: EF%, BP, HR, eGFR, K+, BNP, patient age, gender
- Run: `grep -rn "ef\|egfr\|sbp\|bloodPressure\|heartRate\|potassium\|bnp" src/ --include="*.ts" | grep -i "fetch\|api\|claude\|anthropic"`

### 4. Transparency
- Every rule must link to guideline_id + DOI in ruleset JSON
- UI must label all outputs as "Rule-derived" or "AI-generated"

### 5. Non-Blaming Language
- Search entire codebase: `grep -rni "clinical.inertia\|physician.fault\|doctor.error\|blame\|negligence" src/`
- CLINICAL_INERTIA enum is OK internally, but NEVER in user-facing text
- User-facing label must be: "No identified blocker"

### 6. Multi-Guideline Honesty
- When AHA and ESC differ, BOTH must be displayed
- Search for single-guideline references where dual display is required

### 7. Data Protection
- DEMO MODE badge on every screen
- No localStorage/sessionStorage of patient data
- No analytics/tracking with patient values

### 8. Appropriate Uncertainty
- UNKNOWN status prominently displayed (not hidden)
- STALE_LABS/STALE_VITALS trigger visible warnings

### 9. Audit Trail
- All interactions logged with timestamps
- Physician actions (reason selection, edits) recorded

### 10. Human-in-the-Loop
- No auto-submission of data
- Physician must explicitly trigger each audit

## Output

Generate a safety report:
- PASS / FAIL / N/A for each item
- Specific file:line references for any FAIL
- Recommended fixes for each FAIL

$ARGUMENTS
