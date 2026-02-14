import type { AuditResult } from '../types/audit.ts'

export interface LLMContext {
  readonly efCategory: string
  readonly pillarStatuses: ReadonlyArray<{
    readonly pillar: string
    readonly status: string
    readonly blockers: ReadonlyArray<string>
  }>
  readonly guidelineIds: ReadonlyArray<string>
}

export function prepareLLMContext(auditResult: AuditResult): LLMContext {
  return {
    efCategory: auditResult.efCategory,
    pillarStatuses: auditResult.pillarResults.map((pr) => ({
      pillar: pr.pillar,
      status: pr.status,
      blockers: [...pr.blockers],
    })),
    guidelineIds: [],
  }
}
