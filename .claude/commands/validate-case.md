# Validate Synthetic Case

Run a specific demo case through the rule engine and verify output matches expected results.

## Usage

`/validate-case [case_number]`

- `1` = Case 1: 68M HFrEF EF30% (clinical inertia + UTI barrier) -> GDMT 24/100
- `2` = Case 2: 75F HFpEF EF58% (multi-guideline + finerenone)
- `3` = Case 3: 72M HFrEF EF25% (appropriate non-escalation) -> GDMT 41/100
- `all` = Run all cases

## Process

1. Load the synthetic case data from `src/data/cases/`
2. Run through the rule engine
3. Compare output to expected results from DESIGN_SPEC.md:

### Case 1 Expected
| Pillar | Status | Blocker |
|--------|--------|---------|
| ARNI/ACEi/ARB | UNDERDOSED | CLINICAL_INERTIA |
| Beta-blocker | UNDERDOSED | CLINICAL_INERTIA |
| MRA | MISSING | CLINICAL_INERTIA |
| SGLT2i | MISSING | ADR_HISTORY |
| **GDMT Score** | **24/100** | |

### Case 2 Expected
| Item | Status | Guideline |
|------|--------|-----------|
| SGLT2i | MISSING | AHA: 2a / ESC: I-A |
| Finerenone | OPPORTUNITY | ESC: IIa-B / AHA: Not graded |

### Case 3 Expected
| Pillar | Status | Blocker |
|--------|--------|---------|
| ARNI | UNDERDOSED | BP_LOW |
| Beta-blocker | UNDERDOSED | BP_LOW |
| MRA | ON_TARGET (alert) | K_HIGH |
| SGLT2i | ON_TARGET | None |
| **GDMT Score** | **41/100** | |

4. Report PASS/FAIL per pillar with diff if mismatched

$ARGUMENTS
