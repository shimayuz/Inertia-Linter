import type { BarrierInfo } from '../types/inertia-buster'

const ARNI_DISCLAIMER =
  'This is informational content derived from published guidelines and trial data. It does not constitute a recommendation. Clinical decisions must integrate patient-specific factors.'

export const ARNI_BARRIERS: ReadonlyArray<BarrierInfo> = [
  {
    blockerId: 'arni-adr-cough',
    pillar: 'ARNI_ACEi_ARB',
    blockerCode: 'ADR_HISTORY',
    title: 'ACEi-Related Cough',
    information: [
      'ACEi cough is bradykinin-mediated; ARBs and ARNI (sacubitril/valsartan) use a different mechanism and do not typically cause this adverse effect.',
      'PARADIGM-HF enrolled patients who previously tolerated ACEi/ARB, and cough rates were comparable between sacubitril/valsartan and enalapril.',
      'Switching from ACEi to ARB or ARNI is a well-established approach for cough intolerance.',
    ],
    practicalOptions: [
      'Switch to ARB if ACEi cough is the sole barrier',
      'Consider ARNI (sacubitril/valsartan) as direct replacement with additional benefit',
      'Allow 36-hour washout period when switching from ACEi to ARNI',
    ],
    whenNotTo: [
      'History of angioedema with ACEi (use ARB with caution, ARNI contraindicated)',
      'Cough persists after switching, suggesting alternative etiology',
    ],
    evidenceSource:
      'PARADIGM-HF (NEJM 2014), AHA/ACC/HFSA 2022 Guideline',
    disclaimer: ARNI_DISCLAIMER,
  },
  {
    blockerId: 'arni-bp-low',
    pillar: 'ARNI_ACEi_ARB',
    blockerCode: 'BP_LOW',
    title: 'Hypotension with ARNI/ACEi/ARB',
    information: [
      'Starting at the lowest available dose minimizes hypotension risk.',
      'In PARADIGM-HF, symptomatic hypotension was more common with sacubitril/valsartan but rarely led to discontinuation.',
      'Reducing or discontinuing other vasodilators and diuretics may create BP headroom for RAAS inhibitor initiation.',
    ],
    practicalOptions: [
      'Start at lowest dose and up-titrate gradually (every 2-4 weeks)',
      'Reduce loop diuretic dose if patient is euvolemic',
      'Separate dosing from other BP-lowering medications',
    ],
    whenNotTo: [
      'SBP consistently below 90 mmHg despite dose adjustments of other agents',
      'Cardiogenic shock or acute hemodynamic instability',
    ],
    evidenceSource:
      'PARADIGM-HF (NEJM 2014), AHA/ACC/HFSA 2022 Guideline',
    disclaimer: ARNI_DISCLAIMER,
  },
  {
    blockerId: 'arni-cost',
    pillar: 'ARNI_ACEi_ARB',
    blockerCode: 'COST_BARRIER',
    title: 'Cost Barrier for ARNI',
    information: [
      'Generic ACEi and ARB alternatives are available at low cost.',
      'While ARNI (sacubitril/valsartan) showed superiority over enalapril in HFrEF, ACEi or ARB is acceptable when ARNI is not accessible.',
      'Using generic ACEi or ARB maintains RAAS inhibition while addressing cost concerns.',
    ],
    practicalOptions: [
      'Use generic ACEi (e.g., enalapril, lisinopril) as bridge therapy',
      'Use generic ARB (e.g., losartan, valsartan) if ACEi not tolerated',
      'Apply for manufacturer assistance for ARNI if clinically preferred',
    ],
    whenNotTo: [
      'Patient has specific indication for ARNI over ACEi/ARB (e.g., persistent symptoms on ACEi)',
    ],
    evidenceSource:
      'PARADIGM-HF (NEJM 2014), AHA/ACC/HFSA 2022 Guideline',
    disclaimer: ARNI_DISCLAIMER,
  },
  {
    blockerId: 'arni-clinical-inertia',
    pillar: 'ARNI_ACEi_ARB',
    blockerCode: 'CLINICAL_INERTIA',
    title: 'No Identified Barrier to ARNI/ACEi/ARB',
    information: [
      'This is an information gap, not a clinical blocker.',
      'RAAS inhibition is the cornerstone of HFrEF therapy with Class I recommendation (AHA and ESC).',
      'ARNI preferred over ACEi/ARB when tolerated (AHA Class I).',
    ],
    practicalOptions: [
      'Review whether initiation was previously considered and documented',
      'Confirm no undocumented contraindication exists',
      'Confirm ACEi-to-ARNI washout (36 hours) if switching',
    ],
    whenNotTo: [
      'Patient has a documented reason not captured in structured data',
    ],
    evidenceSource:
      'PARADIGM-HF (NEJM 2014), AHA/ACC/HFSA 2022 Guideline, ESC 2021',
    disclaimer: ARNI_DISCLAIMER,
  },
]
