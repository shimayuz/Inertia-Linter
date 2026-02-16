# UX Information Density Redesign

## Problem

Center pane is 1300-2500px tall. Users scroll down to see results, then back up to edit form data. The form-to-results round-trip is the primary UX pain point.

## Solution: Collapsible Form + Sticky Score

Two changes that eliminate the scroll problem:

### 1. Auto-Collapse Form After Audit

- After `runAudit()` completes, form collapses to a **Patient Summary Bar** (~48px)
- Summary bar shows: Name, Age/Sex, EF, NYHA Class, Edit button
- Clicking "Edit" re-expands the full form
- Re-running audit auto-collapses again
- ~850px of form reduced to ~48px

### 2. Sticky Score Bar

- GDMT Score becomes a compact sticky bar (~48px) below the summary bar
- Shows: Score number, progress bar, EF category, Export button — all in one row
- Current 180px score card reduced to ~48px
- Always visible while scrolling through Action Plan and Pillar Dashboard

### Result

```
Before: Form(850px) + Score(180px) + Actions + Pillars = 1300-2500px
After:  Summary(48px) + Score(48px) + Actions + Pillars = 500-1200px
```

User sees results immediately after audit. No scrolling needed to reach Action Plan.

## Files to Modify

- `src/components/Dashboard.tsx` — Manage collapsed state, layout changes
- `src/components/PatientForm.tsx` — Accept collapsed prop, render summary bar when collapsed
- `src/components/GDMTScore.tsx` — Compact sticky variant

## Files to Create

- `src/components/PatientSummaryBar.tsx` — Collapsed form summary (1 line)
- `src/components/StickyScoreBar.tsx` — Compact sticky score display

## Constraints

- No changes to engine, types, or data files
- All existing functionality preserved
- Form can always be re-expanded
- Sidebar patient selection still works (auto-runs audit, form collapses)
