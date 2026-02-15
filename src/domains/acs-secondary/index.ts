import type { ClinicalDomain } from '../types.ts'
import type { FHIRCondition } from '../../fhir/types.ts'
import { CONDITION_CODES } from '../../fhir/types.ts'

const ACS_CODES: ReadonlyArray<string> = [
  CONDITION_CODES.ACS.SNOMED,
  CONDITION_CODES.ACS.ICD,
]

function isACSCondition(condition: FHIRCondition): boolean {
  const codings = condition.code?.coding ?? []
  return codings.some(
    (coding) => coding.code !== undefined && ACS_CODES.includes(coding.code),
  )
}

export const ACS_SECONDARY_DOMAIN: ClinicalDomain = {
  id: 'acs-secondary',
  name: 'ACS Secondary Prevention',
  version: '0.1.0-stub',
  description:
    'Secondary prevention audit for Acute Coronary Syndrome. Evaluates statin intensity, PCSK9 inhibitor use, dual antiplatelet therapy, beta-blocker, and ACEi/ARB optimization.',
  pillars: [
    'HIGH_INTENSITY_STATIN',
    'PCSK9_INHIBITOR',
    'DAPT',
    'BETA_BLOCKER',
    'ACEi_ARB',
  ],
  status: 'stub',
  applicableTo: (conditions) => conditions.some(isACSCondition),
  transformBundle: () => {
    throw new Error('ACS Secondary Prevention domain is not yet implemented')
  },
  runAudit: () => {
    throw new Error('ACS Secondary Prevention domain is not yet implemented')
  },
}
