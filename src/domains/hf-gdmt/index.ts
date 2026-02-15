import type { ClinicalDomain } from '../types.ts'
import type { FHIRCondition } from '../../fhir/types.ts'
import { CONDITION_CODES } from '../../fhir/types.ts'
import { fhirToSnapshot } from '../../fhir/fhir-to-snapshot.ts'
import { runAudit } from '../../engine/audit.ts'

const HEART_FAILURE_CODES: ReadonlyArray<string> = [
  CONDITION_CODES.HEART_FAILURE.SNOMED,
  CONDITION_CODES.HEART_FAILURE.ICD,
]

function isHeartFailureCondition(condition: FHIRCondition): boolean {
  const codings = condition.code?.coding ?? []
  return codings.some(
    (coding) => coding.code !== undefined && HEART_FAILURE_CODES.includes(coding.code),
  )
}

export const HF_GDMT_DOMAIN: ClinicalDomain = {
  id: 'hf-gdmt',
  name: 'Heart Failure GDMT',
  version: '2.0.0',
  description:
    'Guideline-Directed Medical Therapy audit for heart failure (HFrEF, HFmrEF, HFpEF). Evaluates 4-pillar optimization based on AHA/ACC/HFSA 2022-2023 and ESC 2021-2024 guidelines.',
  pillars: ['ARNI_ACEi_ARB', 'BETA_BLOCKER', 'MRA', 'SGLT2i'],
  status: 'active',
  applicableTo: (conditions) => conditions.some(isHeartFailureCondition),
  transformBundle: (bundle) => fhirToSnapshot(bundle),
  runAudit: (snapshot) => runAudit(snapshot),
}
