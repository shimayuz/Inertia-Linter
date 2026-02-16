import type { ClinicalDomain } from '../types.ts'
import type { FHIRCondition } from '../../fhir/types.ts'
import { CONDITION_CODES } from '../../fhir/types.ts'
import { runHTNAudit } from './engine.ts'

const HYPERTENSION_CODES: ReadonlyArray<string> = [
  CONDITION_CODES.HYPERTENSION.SNOMED,
  CONDITION_CODES.HYPERTENSION.ICD,
]

function isHypertensionCondition(condition: FHIRCondition): boolean {
  const codings = condition.code?.coding ?? []
  return codings.some(
    (coding) => coding.code !== undefined && HYPERTENSION_CODES.includes(coding.code),
  )
}

export const HTN_CONTROL_DOMAIN: ClinicalDomain = {
  id: 'htn-control',
  name: 'Hypertension Control',
  version: '1.0.0',
  description:
    'Hypertension control audit evaluating 4-pillar optimization (ACEi/ARB, CCB, Thiazide, Beta-blocker) based on AHA/ACC 2017 and ESC 2023 guidelines. Beta-blocker scored only with compelling indications.',
  pillars: ['ACEi_ARB_HTN', 'CCB', 'THIAZIDE', 'BETA_BLOCKER_HTN'],
  status: 'active',
  applicableTo: (conditions) => conditions.some(isHypertensionCondition),
  transformBundle: () => {
    throw new Error('Hypertension Control FHIR transform is not yet implemented')
  },
  runAudit: (snapshot) => runHTNAudit(snapshot),
}
