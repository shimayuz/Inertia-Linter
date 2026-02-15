import type { BarrierInfo } from '../types/inertia-buster'

const ACEI_ARB_DISCLAIMER =
  'This is informational content derived from published guidelines and trial data. It does not constitute a recommendation. Clinical decisions must integrate patient-specific factors.'

export const ACEI_ARB_BARRIERS: ReadonlyArray<BarrierInfo> = [
  {
    blockerId: 'acei-arb-adr-cough',
    pillar: 'ARNI_ACEi_ARB',
    blockerCode: 'ADR_HISTORY',
    title: 'ACEi-Related Cough',
    information: [
      'ACEi cough is bradykinin-mediated and occurs in 5-20% of patients; ARBs do not typically cause this adverse effect.',
      'Switching from ACEi to ARB is a well-established approach for cough intolerance, maintaining RAAS inhibition.',
      'If HFrEF with EF <=40%, consider switching to ARNI (sacubitril/valsartan) which demonstrated superiority over enalapril in PARADIGM-HF.',
    ],
    practicalOptions: [
      'Switch to ARB (e.g., losartan, valsartan, candesartan) if ACEi cough is the sole barrier',
      'Consider ARNI (sacubitril/valsartan) as an upgrade option in HFrEF',
      'Allow 36-hour washout period when switching from ACEi to ARNI',
    ],
    whenNotTo: [
      'History of angioedema with ACEi (use ARB with caution, ARNI contraindicated)',
      'Cough persists after switching, suggesting alternative etiology',
    ],
    evidenceSource:
      'AHA/ACC/HFSA 2022 Guideline, ESC 2021',
    disclaimer: ACEI_ARB_DISCLAIMER,
  },
  {
    blockerId: 'acei-arb-bp-low',
    pillar: 'ARNI_ACEi_ARB',
    blockerCode: 'BP_LOW',
    title: 'Hypotension with ACEi/ARB',
    information: [
      'Starting at the lowest available dose minimizes hypotension risk.',
      'ACEi and ARB are available in multiple dose formulations, allowing fine-grained titration.',
      'Reducing or discontinuing other vasodilators and diuretics may create BP headroom for RAAS inhibitor initiation or up-titration.',
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
      'AHA/ACC/HFSA 2022 Guideline, ESC 2021',
    disclaimer: ACEI_ARB_DISCLAIMER,
  },
  {
    blockerId: 'acei-arb-clinical-inertia',
    pillar: 'ARNI_ACEi_ARB',
    blockerCode: 'CLINICAL_INERTIA',
    title: 'No Identified Barrier to ACEi/ARB',
    information: [
      'This is an information gap, not a clinical blocker.',
      'RAAS inhibition is the cornerstone of HFrEF therapy with Class I recommendation (AHA and ESC).',
      'In patients who cannot access or tolerate ARNI, ACEi or ARB remains first-line RAAS inhibition.',
    ],
    practicalOptions: [
      'Review whether initiation was previously considered and documented',
      'Confirm no undocumented contraindication exists',
      'Evaluate whether patient is a candidate for ARNI upgrade',
    ],
    whenNotTo: [
      'Patient has a documented reason not captured in structured data',
    ],
    evidenceSource:
      'AHA/ACC/HFSA 2022 Guideline, ESC 2021',
    disclaimer: ACEI_ARB_DISCLAIMER,
  },
  {
    blockerId: 'acei-arb-cost',
    pillar: 'ARNI_ACEi_ARB',
    blockerCode: 'COST_BARRIER',
    title: 'Cost Barrier for ACEi/ARB',
    information: [
      'Generic ACEi and ARB are widely available at low cost, including $4 pharmacy programs.',
      'Enalapril, lisinopril, losartan, and valsartan are all available as generics.',
      'Cost should rarely be a barrier for this drug class given generic availability.',
    ],
    practicalOptions: [
      'Switch to a generic ACEi (e.g., enalapril, lisinopril) for lowest cost',
      'Switch to a generic ARB (e.g., losartan, valsartan) if ACEi not tolerated',
      'Explore pharmacy discount programs or patient assistance programs',
    ],
    whenNotTo: [
      'Patient requires a specific branded formulation for clinical reasons',
    ],
    evidenceSource:
      'AHA/ACC/HFSA 2022 Guideline',
    disclaimer: ACEI_ARB_DISCLAIMER,
  },
]
