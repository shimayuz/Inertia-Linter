import type { AuditResult } from '../../types/index.ts'

/**
 * Case 2: 75F HFpEF EF 58%
 *
 * HFpEF uses a separate scoring framework.
 * Primary audit target: SGLT2i (multi-guideline difference).
 * Finerenone opportunity flagged (ESC IIa, AHA not graded, T2DM present).
 */
export const case2Expected: AuditResult = {
  efCategory: 'HFpEF',
  pillarResults: [
    {
      pillar: 'SGLT2i',
      status: 'MISSING',
      doseTier: 'NOT_PRESCRIBED',
      blockers: ['CLINICAL_INERTIA'],
      missingInfo: [],
    },
  ],
  gdmtScore: {
    score: 0,
    maxPossible: 25,
    normalized: 0,
    excludedPillars: [],
    isIncomplete: false,
  },
  missingInfo: [],
  nextBestQuestions: [
    'Review SGLT2i — no identified barrier to optimization',
  ],
  timestamp: '',
}
