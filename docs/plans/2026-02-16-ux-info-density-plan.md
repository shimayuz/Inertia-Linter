# UX Info Density Reduction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate form-to-results scroll round-trip by auto-collapsing the form after audit and making the GDMT score sticky.

**Architecture:** Add `isCollapsed` state to Dashboard. When audit runs, form collapses to a 48px PatientSummaryBar. GDMTScore gets a compact inline variant that sticks below the summary bar. Form re-expands on "Edit" click.

**Tech Stack:** React 19.2, TypeScript 5.9, Tailwind 4.1

---

### Task 1: Create PatientSummaryBar Component

**Files:**
- Create: `src/components/PatientSummaryBar.tsx`

**Context:** This component replaces the full ~850px PatientForm after audit runs. It shows key patient identifiers in a single 48px row so the user always knows whose data they're looking at without scrolling.

**Step 1: Create the component**

```tsx
// src/components/PatientSummaryBar.tsx
import { useTranslation } from 'react-i18next'
import type { PatientSnapshot } from '../types/patient.ts'
import { classifyEF } from '../engine/classify-ef.ts'

interface PatientSummaryBarProps {
  readonly patient: PatientSnapshot
  readonly onEdit: () => void
}

export function PatientSummaryBar({ patient, onEdit }: PatientSummaryBarProps) {
  const { t } = useTranslation()
  const efCategory = classifyEF(patient.ef)

  // Build medication count
  const activeMedCount = patient.medications.filter(
    (m) => m.doseTier !== 'NOT_PRESCRIBED',
  ).length

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-2.5 mb-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
          </svg>
        </div>

        <div className="flex items-center gap-2 flex-wrap min-w-0 text-sm">
          <span className="font-semibold text-gray-900 truncate">
            EF {patient.ef}%
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600">
            {efCategory}
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600">
            NYHA {['I', 'II', 'III', 'IV'][patient.nyhaClass - 1]}
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500 text-xs">
            {t('summary.medsActive', { count: activeMedCount })}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 hover:bg-teal-50 px-2.5 py-1.5 rounded-md transition-colors flex-shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
        </svg>
        {t('summary.edit')}
      </button>
    </div>
  )
}
```

**Step 2: Add i18n keys**

Add to `src/i18n/locales/en/ui.json`:
```json
"summary.medsActive": "{{count}} meds active",
"summary.edit": "Edit"
```

Add to `src/i18n/locales/ja/ui.json`:
```json
"summary.medsActive": "{{count}}剤処方中",
"summary.edit": "編集"
```

**Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: PASS (no errors)

---

### Task 2: Create StickyScoreBar Component

**Files:**
- Create: `src/components/StickyScoreBar.tsx`

**Context:** This is a compact, horizontally-oriented GDMT score display that sticks to the top of the scroll area. It replaces the current tall centered GDMTScore card when in collapsed mode. Shows score, progress bar, EF category, and export button all in one ~48px row.

**Step 1: Create the component**

```tsx
// src/components/StickyScoreBar.tsx
import { useTranslation } from 'react-i18next'
import { PILLAR_LABELS } from '../types/pillar'
import type { GDMTScore } from '../types/audit'
import type { PatientSnapshot } from '../types/patient.ts'
import type { AuditResult } from '../types/audit'
import { ExportButton } from './ExportButton'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel'

interface StickyScoreBarProps {
  readonly score: GDMTScore
  readonly efCategory?: string
  readonly auditResult: AuditResult
  readonly patient: PatientSnapshot
}

function getBarColor(normalized: number): string {
  if (normalized <= 30) return 'bg-red-500'
  if (normalized <= 60) return 'bg-amber-500'
  return 'bg-green-500'
}

function getScoreColor(normalized: number): string {
  if (normalized <= 30) return 'text-red-600'
  if (normalized <= 60) return 'text-amber-600'
  return 'text-green-600'
}

export function StickyScoreBar({ score, efCategory, auditResult, patient }: StickyScoreBarProps) {
  const { t } = useTranslation()
  const { normalized, maxPossible, excludedPillars } = score
  const barColor = getBarColor(normalized)
  const scoreColor = getScoreColor(normalized)
  const isHFpEF = efCategory === 'HFpEF'
  const title = t(isHFpEF ? 'score.hfpefScore' : 'score.gdmtScore')

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-2.5 -mx-5 mb-4"
         style={{ marginLeft: '-1.25rem', marginRight: '-1.25rem', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
      <div className="flex items-center gap-4">
        {/* Score title + number */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {title}
          </span>
          <span className={`text-xl font-extrabold font-mono tabular-nums ${scoreColor}`}>
            {score.score}
            <span className="text-sm font-semibold text-gray-300">/{maxPossible}</span>
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="h-2 w-32 overflow-hidden rounded-full bg-gray-100 flex-shrink-0"
          role="progressbar"
          aria-valuenow={normalized}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(normalized, 100)}%` }}
          />
        </div>

        {/* EF Category badge */}
        {efCategory && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {efCategory}
          </span>
        )}

        {/* Excluded pillars */}
        {excludedPillars.length > 0 && (
          <span className="text-[10px] text-gray-400 hidden lg:inline">
            {t('score.excludedContraindicated', {
              pillars: excludedPillars.map((p) => PILLAR_LABELS[p]).join(', '),
            })}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Rule derived + Export */}
        <RuleDerivedLabel className="hidden sm:block" />
        <ExportButton auditResult={auditResult} patient={patient} />
      </div>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 3: Wire Up Dashboard — Collapse State + New Components

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Context:** This is the main integration task. Add `isFormCollapsed` state that flips to `true` after audit, `false` on edit click or manual entry. Swap PatientForm / PatientSummaryBar based on state. Replace GDMTScore + ExportButton with StickyScoreBar when collapsed.

**Step 1: Add imports and state**

In `Dashboard.tsx`, add imports:
```tsx
import { PatientSummaryBar } from './PatientSummaryBar.tsx'
import { StickyScoreBar } from './StickyScoreBar.tsx'
```

Add state:
```tsx
const [isFormCollapsed, setIsFormCollapsed] = useState(false)
```

**Step 2: Update handleAudit to collapse form**

Change `handleAudit`:
```tsx
const handleAudit = useCallback((patient: PatientSnapshot, timeline?: PatientTimeline) => {
  setIsLoading(true)
  const result = runAudit(patient)
  setAuditResult(result)
  setCurrentPatient(patient)
  setCurrentTimeline(timeline ?? null)
  setSelectedPillar(null)
  setIsLoading(false)
  setIsFormCollapsed(true)  // <-- ADD THIS
}, [])
```

**Step 3: Update handleManualEntry to expand form**

Change `handleManualEntry`:
```tsx
const handleManualEntry = useCallback(() => {
  setSelectedPatientId(null)
  setPreloadedPatient(null)
  setAuditResult(null)
  setCurrentPatient(null)
  setCurrentTimeline(null)
  setExtractionResult(null)
  setIsFormCollapsed(false)  // <-- ADD THIS
}, [])
```

**Step 4: Add handleEditPatient callback**

```tsx
const handleEditPatient = useCallback(() => {
  setIsFormCollapsed(false)
}, [])
```

**Step 5: Update center pane JSX**

Replace the current center pane content (inside the `sticky top-14` div) with:

```tsx
{/* Collapsed: Summary bar + Sticky score + Results */}
{isFormCollapsed && currentPatient ? (
  <>
    <PatientSummaryBar patient={currentPatient} onEdit={handleEditPatient} />
    {auditResult && (
      <>
        <StickyScoreBar
          score={auditResult.gdmtScore}
          efCategory={auditResult.efCategory}
          auditResult={auditResult}
          patient={currentPatient}
        />
        <div className="mt-4">
          <InertiaActionPlan auditResult={auditResult} llmContext={llmContext} medications={currentPatient?.medications} snapshot={currentPatient} />
        </div>
        <div className="mt-4">
          <PillarDashboard
            results={auditResult.pillarResults}
            selectedPillar={selectedPillar}
            onSelectPillar={setSelectedPillar}
          />
        </div>
      </>
    )}
  </>
) : (
  <>
    {/* Expanded: Full form + results below */}
    {showImageUpload && (
      <div className="mb-3">
        <ImageUpload onExtracted={handleExtracted} />
      </div>
    )}

    <PatientForm
      onSubmit={handleAudit}
      isLoading={isLoading}
      extractionResult={extractionResult}
      onTimelineSelect={setCurrentTimeline}
      preloadedPatient={preloadedPatient}
    />

    {hasResults ? (
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <GDMTScore
            score={auditResult.gdmtScore}
            efCategory={auditResult.efCategory}
          />
          {currentPatient && (
            <ExportButton
              auditResult={auditResult}
              patient={currentPatient}
            />
          )}
        </div>
        <div className="mt-4">
          <InertiaActionPlan auditResult={auditResult} llmContext={llmContext} medications={currentPatient?.medications} snapshot={currentPatient} />
        </div>
        <div className="mt-4">
          <PillarDashboard
            results={auditResult.pillarResults}
            selectedPillar={selectedPillar}
            onSelectPillar={setSelectedPillar}
          />
        </div>
      </div>
    ) : (
      <ResultsEmptyState />
    )}
  </>
)}
```

**Step 6: Verify**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: All pass

---

### Task 4: Add i18n Keys + Final Polish

**Files:**
- Modify: `src/i18n/locales/en/ui.json`
- Modify: `src/i18n/locales/ja/ui.json`

**Step 1: Add English keys**

Add after existing keys:
```json
"summary.medsActive": "{{count}} meds active",
"summary.edit": "Edit"
```

**Step 2: Add Japanese keys**

Add after existing keys:
```json
"summary.medsActive": "{{count}}剤処方中",
"summary.edit": "編集"
```

**Step 3: Full verification**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: All pass. 424+ tests green, build succeeds.
