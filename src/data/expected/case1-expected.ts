import type { AuditResult } from '../../types/index.ts'

export const case1Expected: AuditResult = {
  efCategory: 'HFrEF',
  pillarResults: [
    {
      pillar: 'ARNI_ACEi_ARB',
      status: 'UNDERDOSED',
      doseTier: 'LOW',
      blockers: ['CLINICAL_INERTIA'],
      missingInfo: [],
    },
    {
      pillar: 'BETA_BLOCKER',
      status: 'UNDERDOSED',
      doseTier: 'MEDIUM',
      blockers: ['CLINICAL_INERTIA'],
      missingInfo: [],
    },
    {
      pillar: 'MRA',
      status: 'MISSING',
      doseTier: 'NOT_PRESCRIBED',
      blockers: ['CLINICAL_INERTIA'],
      missingInfo: [],
    },
    {
      pillar: 'SGLT2i',
      status: 'MISSING',
      doseTier: 'NOT_PRESCRIBED',
      blockers: ['ADR_HISTORY'],
      missingInfo: [],
    },
  ],
  gdmtScore: {
    score: 24,
    maxPossible: 100,
    normalized: 24,
    excludedPillars: [],
    isIncomplete: false,
  },
  missingInfo: [],
  nextBestQuestions: [
    'Review ARNI/ACEi/ARB — no identified barrier to optimization',
    'Review Beta-blocker — no identified barrier to optimization',
    'Review MRA — no identified barrier to optimization',
    'Review previous adverse reaction and consider re-challenge or alternative',
  ],
  timestamp: '',
}
