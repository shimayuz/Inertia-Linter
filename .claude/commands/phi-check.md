# PHI Leak Detection

Scan the entire codebase for potential PHI (Protected Health Information) leakage.

## What This Checks

### 1. API Call Inspection
Find all external API calls and verify they send ONLY abstract codes:
```
Allowed: pillar status codes, blocker codes, guideline IDs, EF category label
FORBIDDEN: EF%, SBP, HR, eGFR, K+, BNP, NT-proBNP, HbA1c, age, gender, any numerical patient value
```

### 2. Network Request Audit
Search for: fetch, axios, XMLHttpRequest, WebSocket, EventSource
Verify no patient data objects are serialized and sent.

### 3. Storage Check
Search for: localStorage, sessionStorage, indexedDB, cookies
Patient data should NEVER be persisted.

### 4. Logging Check
Search for: console.log, console.debug, console.info
Ensure no patient values are logged (even in development).

### 5. Analytics Check
Search for: gtag, analytics, tracking, beacon, pixel
No patient data in analytics payloads.

## Commands

```bash
# API calls with patient data patterns
grep -rn "fetch\|axios\|XMLHttpRequest" src/ --include="*.ts" --include="*.tsx"

# Storage operations
grep -rn "localStorage\|sessionStorage\|indexedDB\|document.cookie" src/ --include="*.ts" --include="*.tsx"

# Console logs with patient data
grep -rn "console\.\(log\|debug\|info\)" src/ --include="*.ts" --include="*.tsx"
```

## Output

Generate a PHI audit report with PASS/FAIL per category.
Any FAIL is a **critical** finding that must be fixed immediately.

$ARGUMENTS
