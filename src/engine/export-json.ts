import type { AuditResult } from '../types/audit.ts'

export function exportJSON(auditResult: AuditResult): string {
  const exportData = {
    _meta: {
      generator: 'Inertia Linter (Guideline-as-Code v2)',
      disclaimer: 'DRAFT — Pending physician review. SYNTHETIC DATA ONLY.',
      timestamp: auditResult.timestamp,
    },
    efCategory: auditResult.efCategory,
    gdmtScore: auditResult.gdmtScore,
    pillarResults: auditResult.pillarResults,
    missingInfo: auditResult.missingInfo,
    nextBestQuestions: auditResult.nextBestQuestions,
  }

  return JSON.stringify(exportData, null, 2)
}
