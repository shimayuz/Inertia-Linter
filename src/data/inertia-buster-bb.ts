import type { BarrierInfo } from '../types/inertia-buster'

const BB_DISCLAIMER =
  'This is informational content derived from published guidelines and trial data. It does not constitute a recommendation. Clinical decisions must integrate patient-specific factors.'

export const BB_BARRIERS: ReadonlyArray<BarrierInfo> = [
  {
    blockerId: 'bb-hr-low',
    pillar: 'BETA_BLOCKER',
    blockerCode: 'HR_LOW',
    title: 'Bradycardia Concern with Beta-Blocker',
    information: [
      'Target resting heart rate for beta-blocker in HFrEF is generally above 60 bpm.',
      'Bradycardia in HF trials was generally manageable with dose adjustment rather than discontinuation.',
      'Concomitant rate-lowering medications (digoxin, amiodarone, non-DHP CCBs) should be reviewed before attributing bradycardia solely to beta-blocker.',
    ],
    practicalOptions: [
      'Reduce or discontinue concomitant rate-lowering agents if present',
      'Down-titrate beta-blocker to a tolerated dose rather than discontinuing',
      'Monitor resting HR at consistent time points (avoid measuring immediately after rest)',
    ],
    whenNotTo: [
      'Symptomatic bradycardia with hemodynamic compromise',
      'High-degree AV block without permanent pacemaker',
      'Resting HR consistently below 50 bpm despite dose reduction',
    ],
    evidenceSource:
      'MERIT-HF (Lancet 1999), COPERNICUS (NEJM 2001), AHA/ACC/HFSA 2022 Guideline',
    disclaimer: BB_DISCLAIMER,
  },
  {
    blockerId: 'bb-adr-fatigue',
    pillar: 'BETA_BLOCKER',
    blockerCode: 'ADR_HISTORY',
    title: 'Fatigue with Beta-Blocker',
    information: [
      'Fatigue is often transient during the first 2-4 weeks of initiation or up-titration.',
      'HF itself is a major cause of fatigue; beta-blocker-related fatigue may be overattributed.',
      'Switching from non-selective to beta-1 selective agent may improve tolerability.',
    ],
    practicalOptions: [
      'Slow up-titration with longer intervals between dose increases',
      'Switch to a beta-1 selective agent (bisoprolol, metoprolol succinate)',
      'Reassess after 4-6 weeks as tolerance often develops',
    ],
    whenNotTo: [
      'Severe fatigue limiting activities of daily living that does not improve over weeks',
      'Evidence of low cardiac output syndrome',
    ],
    evidenceSource:
      'MERIT-HF (Lancet 1999), CIBIS-II (Lancet 1999), AHA/ACC/HFSA 2022 Guideline',
    disclaimer: BB_DISCLAIMER,
  },
  {
    blockerId: 'bb-adr-copd',
    pillar: 'BETA_BLOCKER',
    blockerCode: 'ADR_HISTORY',
    title: 'COPD/Asthma Concern with Beta-Blocker',
    information: [
      'Beta-1 selective agents (bisoprolol, metoprolol succinate) are safe in COPD and demonstrated mortality benefit.',
      'Large observational data and meta-analyses confirm safety of cardioselective beta-blockers in COPD.',
      'Asthma (especially severe reactive airway disease) is a different consideration from COPD regarding beta-blocker safety.',
    ],
    practicalOptions: [
      'Use beta-1 selective agent (bisoprolol preferred for COPD patients)',
      'Start at low dose and titrate cautiously with respiratory monitoring',
      'Coordinate with pulmonologist if severe obstructive disease',
    ],
    whenNotTo: [
      'Severe active asthma with frequent exacerbations',
      'Documented bronchospasm with beta-1 selective agent',
    ],
    evidenceSource:
      'CIBIS-II (Lancet 1999), AHA/ACC/HFSA 2022 Guideline, ESC 2021 Guideline',
    disclaimer: BB_DISCLAIMER,
  },
  {
    blockerId: 'bb-bp-low',
    pillar: 'BETA_BLOCKER',
    blockerCode: 'BP_LOW',
    title: 'Hypotension with Beta-Blocker',
    information: [
      'Beta-blockers have a smaller BP-lowering effect compared to RAAS inhibitors.',
      'In HFrEF, beta-blockers primarily reduce heart rate rather than blood pressure.',
      'Carvedilol has more alpha-blocking (vasodilatory) effect than metoprolol or bisoprolol.',
    ],
    practicalOptions: [
      'Consider switching to metoprolol succinate or bisoprolol if on carvedilol',
      'Start at lowest available dose',
      'Reduce other vasodilators if possible to create BP headroom',
    ],
    whenNotTo: [
      'SBP consistently below 90 mmHg despite adjustment of other agents',
      'Acute decompensated HF (do not initiate, but do not stop established therapy)',
    ],
    evidenceSource:
      'COPERNICUS (NEJM 2001), AHA/ACC/HFSA 2022 Guideline',
    disclaimer: BB_DISCLAIMER,
  },
  {
    blockerId: 'bb-clinical-inertia',
    pillar: 'BETA_BLOCKER',
    blockerCode: 'CLINICAL_INERTIA',
    title: 'No Identified Barrier to Beta-Blocker',
    information: [
      'This is an information gap, not a clinical blocker.',
      'Evidence-based beta-blockers (carvedilol, metoprolol succinate, bisoprolol) have Class I recommendation for HFrEF (AHA and ESC).',
      'Mortality reduction approximately 34% in landmark trials (MERIT-HF, COPERNICUS, CIBIS-II).',
    ],
    practicalOptions: [
      'Review whether initiation was previously considered and documented',
      'Confirm no undocumented contraindication exists',
      'Ensure an evidence-based beta-blocker is selected (not all beta-blockers have HF evidence)',
    ],
    whenNotTo: [
      'Acute decompensated HF (stabilize first, then initiate before discharge)',
      'Patient has a documented reason not captured in structured data',
    ],
    evidenceSource:
      'MERIT-HF (Lancet 1999), COPERNICUS (NEJM 2001), CIBIS-II (Lancet 1999), AHA/ACC/HFSA 2022',
    disclaimer: BB_DISCLAIMER,
  },
]
