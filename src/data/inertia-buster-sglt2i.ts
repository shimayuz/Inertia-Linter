import type { BarrierInfo } from '../types/inertia-buster'

const SGLT2I_DISCLAIMER =
  'This is informational content derived from published guidelines and trial data. It does not constitute a recommendation. Clinical decisions must integrate patient-specific factors.'

export const SGLT2I_BARRIERS: ReadonlyArray<BarrierInfo> = [
  {
    blockerId: 'sglt2i-adr-uti',
    pillar: 'SGLT2i',
    blockerCode: 'ADR_HISTORY',
    title: 'Prior UTI and SGLT2i Use',
    information: [
      'Published re-challenge data shows most patients can safely resume SGLT2i after uncomplicated UTI.',
      'Absolute risk difference for UTI was small and inconsistent across DAPA-HF and EMPEROR-Reduced.',
      'UTI events in clinical trials were predominantly uncomplicated lower tract infections.',
      'SGLT2i mechanism (glucosuria) is distinct from the pathophysiology of most uncomplicated UTIs.',
    ],
    practicalOptions: [
      'Same agent with hygiene counseling',
      'Switch to alternative SGLT2i',
      'Re-challenge after UTI resolution with monitoring',
    ],
    whenNotTo: [
      'Recurrent or severe UTI (3+ episodes in 12 months)',
      'Pyelonephritis history',
      "Fournier's gangrene history",
    ],
    evidenceSource:
      'DAPA-HF (NEJM 2019), EMPEROR-Reduced (NEJM 2020), ACC ECDP SGLT2i 2024',
    disclaimer: SGLT2I_DISCLAIMER,
  },
  {
    blockerId: 'sglt2i-adr-gmi',
    pillar: 'SGLT2i',
    blockerCode: 'ADR_HISTORY',
    title: 'Genital Mycotic Infection (GMI) History',
    information: [
      'Incidence 2-5% in clinical trials, predominantly mild and self-limiting.',
      'Most episodes resolve with a single course of topical antifungal treatment.',
      'GMI incidence decreases with continued SGLT2i use over time.',
      'Benefit of SGLT2i on HF hospitalization and CV death far outweighs GMI risk in most patients.',
    ],
    practicalOptions: [
      'Prophylactic hygiene measures and patient education',
      'Topical antifungal treatment at first sign of symptoms',
      'Switch to alternative SGLT2i if recurrence with one agent',
    ],
    whenNotTo: [
      'Recurrent severe genital infections despite preventive measures',
      'Immunocompromised patients with chronic mucocutaneous candidiasis',
    ],
    evidenceSource:
      'DAPA-HF (NEJM 2019), EMPEROR-Reduced (NEJM 2020), CREDENCE (NEJM 2019)',
    disclaimer: SGLT2I_DISCLAIMER,
  },
  {
    blockerId: 'sglt2i-bp-low',
    pillar: 'SGLT2i',
    blockerCode: 'BP_LOW',
    title: 'Hypotension Concern with SGLT2i',
    information: [
      'SGLT2i blood pressure effect is modest: approximately 3-4 mmHg systolic reduction.',
      'Osmotic diuresis is the primary mechanism, which may allow loop diuretic dose reduction.',
      'In DAPA-HF and EMPEROR-Reduced, symptomatic hypotension rates were similar between SGLT2i and placebo groups.',
      'Volume depletion events were more common in patients on high-dose loop diuretics.',
    ],
    practicalOptions: [
      'Reduce loop diuretic dose by 50% if euvolemic before SGLT2i initiation',
      'Start SGLT2i and monitor BP over 1-2 weeks',
      'Counsel patients on hydration and postural hypotension symptoms',
    ],
    whenNotTo: [
      'SBP consistently below 90 mmHg despite diuretic adjustment',
      'Active symptomatic hypotension requiring intervention',
    ],
    evidenceSource:
      'DAPA-HF (NEJM 2019), EMPEROR-Reduced (NEJM 2020), AHA/ACC/HFSA 2022 Guideline',
    disclaimer: SGLT2I_DISCLAIMER,
  },
  {
    blockerId: 'sglt2i-egfr-init',
    pillar: 'SGLT2i',
    blockerCode: 'EGFR_LOW_INIT',
    title: 'eGFR Concern for SGLT2i Initiation',
    information: [
      'Initiation thresholds have evolved: some agents now approved to eGFR 20 mL/min/1.73m2.',
      'Initial eGFR dip (10-30%) is expected, hemodynamically mediated, and typically reversible within weeks.',
      'Long-term renoprotective benefit documented even in patients with reduced baseline eGFR.',
      'Continuation thresholds are lower than initiation thresholds for most SGLT2i agents.',
    ],
    practicalOptions: [
      'Verify current eGFR meets initiation threshold for selected agent',
      'Recheck eGFR 2-4 weeks after initiation to confirm stabilization',
      'Continue if eGFR decline is less than 30% from baseline and stabilizes',
    ],
    whenNotTo: [
      'eGFR below agent-specific initiation threshold',
      'Rapidly declining eGFR suggesting acute process',
      'Dialysis-dependent end-stage kidney disease',
    ],
    evidenceSource:
      'DAPA-CKD (NEJM 2020), EMPA-KIDNEY (NEJM 2023), ACC ECDP SGLT2i 2024',
    disclaimer: SGLT2I_DISCLAIMER,
  },
  {
    blockerId: 'sglt2i-clinical-inertia',
    pillar: 'SGLT2i',
    blockerCode: 'CLINICAL_INERTIA',
    title: 'No Identified Barrier to SGLT2i',
    information: [
      'This is an information gap, not a clinical blocker. SGLT2i is Class I (ESC) / Class 2a (AHA) for HFrEF/HFpEF.',
      'No titration required. Fixed dose. Simplest initiation among GDMT pillars.',
      'Number needed to treat (NNT) for HF hospitalization: approximately 21 over 18 months (DAPA-HF).',
      'Mortality benefit demonstrated in HFrEF trials; cardiovascular benefit extends to HFpEF (DELIVER).',
    ],
    practicalOptions: [
      'Review whether initiation was previously considered and documented',
      'Confirm no undocumented contraindication or patient factor exists',
      'Consider initiating at next clinical encounter if no barrier identified',
    ],
    whenNotTo: [
      'Patient has a documented reason not captured in structured data',
      'Active clinical situation where new medication initiation is inappropriate',
    ],
    evidenceSource:
      'DAPA-HF (NEJM 2019), EMPEROR-Reduced (NEJM 2020), DELIVER (NEJM 2022), ESC 2021/2023, AHA 2022',
    disclaimer: SGLT2I_DISCLAIMER,
  },
  {
    blockerId: 'sglt2i-cost',
    pillar: 'SGLT2i',
    blockerCode: 'COST_BARRIER',
    title: 'Cost/Access Barrier for SGLT2i',
    information: [
      'Generic dapagliflozin became available in some markets, potentially reducing cost.',
      'Manufacturer patient assistance programs exist for both dapagliflozin and empagliflozin.',
      'Cost-effectiveness analyses consistently show SGLT2i favorable at current pricing in HF populations.',
    ],
    practicalOptions: [
      'Check formulary coverage and prior authorization requirements',
      'Apply for manufacturer patient assistance program',
      'Consider generic dapagliflozin if available in formulary',
    ],
    whenNotTo: [
      'Patient unable to afford even with assistance programs',
      'Formulary restrictions cannot be resolved within a clinically acceptable timeframe',
    ],
    evidenceSource:
      'ACC ECDP SGLT2i 2024, manufacturer prescribing information',
    disclaimer: SGLT2I_DISCLAIMER,
  },
]
