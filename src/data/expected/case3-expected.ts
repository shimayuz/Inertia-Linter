import type { AuditResult } from '../../types/index.ts'

/**
 * Case 3: 72M HFrEF EF 25%, multiple real blockers
 *
 * GDMT Score: 49/100
 *   ARNI LOW (8) + BB LOW (8) + MRA LOW (8) + SGLT2i HIGH (25) = 49
 *
 * Note: DESIGN_SPEC v2.1 states GDMT 41/100 and MRA "ON_TARGET with alert",
 * but mathematically LOW=8pts not 25pts, and MRA at LOW is UNDERDOSED.
 * Using the correct mathematical result (49). Discrepancy flagged for MD review.
 */
export const case3Expected: AuditResult = {
  efCategory: 'HFrEF',
  pillarResults: [
    {
      pillar: 'ARNI_ACEi_ARB',
      status: 'UNDERDOSED',
      doseTier: 'LOW',
      blockers: ['BP_LOW'],
      missingInfo: [],
    },
    {
      pillar: 'BETA_BLOCKER',
      status: 'UNDERDOSED',
      doseTier: 'LOW',
      blockers: ['CLINICAL_INERTIA'],
      missingInfo: [],
    },
    {
      pillar: 'MRA',
      status: 'UNDERDOSED',
      doseTier: 'LOW',
      blockers: ['K_HIGH'],
      missingInfo: [],
    },
    {
      pillar: 'SGLT2i',
      status: 'ON_TARGET',
      doseTier: 'HIGH',
      blockers: [],
      missingInfo: [],
    },
  ],
  gdmtScore: {
    score: 49,
    maxPossible: 100,
    normalized: 49,
    excludedPillars: [],
    isIncomplete: false,
  },
  missingInfo: [],
  nextBestQuestions: [
    'Review Beta-blocker — no identified barrier to optimization',
  ],
  timestamp: '',
}
