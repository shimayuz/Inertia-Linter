import type { ClinicalDomain } from '../types.ts'
import type { FHIRCondition } from '../../fhir/types.ts'
import { CONDITION_CODES } from '../../fhir/types.ts'
import { runDMAudit } from './engine.ts'

const TYPE2_DIABETES_CODES: ReadonlyArray<string> = [
  CONDITION_CODES.TYPE2_DIABETES.SNOMED,
  CONDITION_CODES.TYPE2_DIABETES.ICD,
]

function isType2DiabetesCondition(condition: FHIRCondition): boolean {
  const codings = condition.code?.coding ?? []
  return codings.some(
    (coding) => coding.code !== undefined && TYPE2_DIABETES_CODES.includes(coding.code),
  )
}

export const DM_MGMT_DOMAIN: ClinicalDomain = {
  id: 'dm-mgmt',
  name: 'Diabetes Management',
  version: '1.0.0',
  description:
    'Diabetes management audit for Type 2 DM. Evaluates 4-pillar optimization (Metformin, SGLT2i, GLP-1 RA, Insulin) based on ADA Standards of Care 2024 and KDIGO 2022 guidelines.',
  pillars: ['METFORMIN', 'SGLT2i_DM', 'GLP1_RA', 'INSULIN'],
  status: 'active',
  applicableTo: (conditions) => conditions.some(isType2DiabetesCondition),
  transformBundle: () => {
    throw new Error('FHIR transform not implemented yet for DM domain')
  },
  runAudit: (snapshot) => runDMAudit(snapshot),
}
