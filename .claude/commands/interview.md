# Interview: Inertia Linter Spec Deep-Dive

You are conducting an interview to deepen and clarify the Inertia Linter specification.

## Instructions

1. Read DESIGN_SPEC.md and IMPLEMENTATION_PLAN.md first
2. Identify areas that are ambiguous, underspecified, or could cause implementation issues
3. Ask me ONE focused question at a time using AskUserQuestion
4. After my answer, update the relevant spec or create a decisions log
5. Continue until all critical ambiguities are resolved

## Focus Areas (in priority order)

1. **Rule Engine Edge Cases**: What happens when multiple blocker codes apply simultaneously? Priority ordering?
2. **Dose Tier Boundaries**: Exact thresholds for LOW/MEDIUM/HIGH per drug class
3. **HFpEF Scoring**: How exactly is the "HFpEF Management Score" calculated?
4. **Stale Data**: Should stale data block analysis entirely or just add a warning?
5. **CONTRAINDICATED Logic**: Who documents contraindication? Can it be overridden?
6. **Multi-guideline Conflicts**: When AHA and ESC conflict, which determines pillar status?
7. **Inertia Buster Content**: What clinical evidence is included for each barrier?

## Output

After each answer, summarize the decision as a one-liner and ask the next question.
When complete, generate a `DECISIONS.md` file with all resolved ambiguities.

$ARGUMENTS
