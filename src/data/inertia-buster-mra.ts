import type { BarrierInfo } from '../types/inertia-buster'

const MRA_DISCLAIMER =
  'This is informational content derived from published guidelines and trial data. It does not constitute a recommendation. Clinical decisions must integrate patient-specific factors.'

export const MRA_BARRIERS: ReadonlyArray<BarrierInfo> = [
  {
    blockerId: 'mra-k-high',
    pillar: 'MRA',
    blockerCode: 'K_HIGH',
    title: 'Hyperkalemia Concern with MRA',
    information: [
      'Potassium below 5.0 mEq/L is generally considered safe for MRA initiation.',
      'RALES and EMPHASIS-HF demonstrated mortality benefit with spironolactone/eplerenone at low doses.',
      'Risk of hyperkalemia increases with concomitant RAAS inhibitors and reduced renal function, requiring monitoring.',
      'Potassium binders (patiromer, sodium zirconium cyclosilicate) can enable MRA use in selected patients.',
    ],
    practicalOptions: [
      'Verify potassium is below 5.0 mEq/L before initiation',
      'Start at lowest dose (spironolactone 12.5 mg or eplerenone 25 mg)',
      'Recheck potassium and renal function within 1 week of initiation, then periodically',
      'Consider potassium binder if mild hyperkalemia prevents MRA use',
    ],
    whenNotTo: [
      'Potassium above 5.5 mEq/L',
      'History of life-threatening hyperkalemia',
      'Severe renal impairment (eGFR below 30) without close monitoring capacity',
    ],
    evidenceSource:
      'RALES (NEJM 1999), EMPHASIS-HF (NEJM 2011), AHA/ACC/HFSA 2022 Guideline',
    disclaimer: MRA_DISCLAIMER,
  },
  {
    blockerId: 'mra-egfr-low',
    pillar: 'MRA',
    blockerCode: 'EGFR_LOW_INIT',
    title: 'Renal Concern with MRA',
    information: [
      'MRA can generally be initiated when eGFR is above 30 mL/min/1.73m2 with appropriate monitoring.',
      'Benefits of MRA in HFrEF are well established even in patients with moderately reduced renal function.',
      'Close monitoring of potassium and creatinine is essential, especially with concomitant RAAS inhibition.',
    ],
    practicalOptions: [
      'Start at reduced dose (spironolactone 12.5 mg or eplerenone 25 mg every other day)',
      'Monitor potassium and renal function within 3-7 days of initiation',
      'Avoid combining with high-dose ACEi/ARB initially',
    ],
    whenNotTo: [
      'eGFR below 30 mL/min/1.73m2 without specialist supervision',
      'Rapidly declining renal function',
      'Already on maximal RAAS blockade with borderline potassium',
    ],
    evidenceSource:
      'RALES (NEJM 1999), EMPHASIS-HF (NEJM 2011), AHA/ACC/HFSA 2022 Guideline',
    disclaimer: MRA_DISCLAIMER,
  },
  {
    blockerId: 'mra-adr-gyneco',
    pillar: 'MRA',
    blockerCode: 'ADR_HISTORY',
    title: 'Gynecomastia/Breast Tenderness with Spironolactone',
    information: [
      'Gynecomastia occurs in approximately 10% of men on spironolactone due to its anti-androgenic properties.',
      'Eplerenone is a selective MRA without significant anti-androgenic effects.',
      'Switching from spironolactone to eplerenone typically resolves gynecomastia.',
    ],
    practicalOptions: [
      'Switch to eplerenone (selective MRA, minimal hormonal side effects)',
      'Consider lower dose spironolactone if eplerenone not available',
    ],
    whenNotTo: [
      'Patient also has resistant hypertension where spironolactone anti-androgenic effect is desired',
    ],
    evidenceSource:
      'RALES (NEJM 1999), EMPHASIS-HF (NEJM 2011), ESC 2021 Guideline',
    disclaimer: MRA_DISCLAIMER,
  },
  {
    blockerId: 'mra-finerenone',
    pillar: 'MRA',
    blockerCode: 'OTHER',
    title: 'Finerenone as Alternative MRA (Emerging Evidence)',
    information: [
      'Finerenone is a nonsteroidal MRA with demonstrated cardiorenal benefit in diabetic kidney disease (FIDELIO-DKD, FIGARO-DKD).',
      'ESC 2023 gives finerenone Class IIa recommendation for HFpEF with CKD and diabetes.',
      'Lower hyperkalemia risk compared to steroidal MRAs in clinical trials.',
      'Not yet established as replacement for spironolactone/eplerenone in HFrEF.',
    ],
    practicalOptions: [
      'Consider finerenone for HFpEF patients with type 2 diabetes and CKD per ESC guidance',
      'Maintain spironolactone/eplerenone for HFrEF unless intolerant',
    ],
    whenNotTo: [
      'HFrEF without diabetes/CKD overlap (insufficient evidence for finerenone in this setting)',
    ],
    evidenceSource:
      'FIDELIO-DKD (NEJM 2020), FIGARO-DKD (NEJM 2021), ESC 2023 HF Guideline Update',
    disclaimer: MRA_DISCLAIMER,
  },
  {
    blockerId: 'mra-clinical-inertia',
    pillar: 'MRA',
    blockerCode: 'CLINICAL_INERTIA',
    title: 'No Identified Barrier to MRA',
    information: [
      'This is an information gap, not a clinical blocker.',
      'MRA has Class I recommendation for HFrEF (AHA and ESC).',
      'RALES demonstrated 30% relative risk reduction in mortality with spironolactone in severe HFrEF.',
    ],
    practicalOptions: [
      'Review whether initiation was previously considered and documented',
      'Confirm potassium and renal function are adequate for initiation',
      'Confirm no undocumented contraindication exists',
    ],
    whenNotTo: [
      'Patient has a documented reason not captured in structured data',
    ],
    evidenceSource:
      'RALES (NEJM 1999), EMPHASIS-HF (NEJM 2011), AHA/ACC/HFSA 2022, ESC 2021',
    disclaimer: MRA_DISCLAIMER,
  },
]
