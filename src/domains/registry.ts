import type { ClinicalDomain } from './types.ts'
import { HF_GDMT_DOMAIN } from './hf-gdmt/index.ts'
import { ACS_SECONDARY_DOMAIN } from './acs-secondary/index.ts'
import { DM_MGMT_DOMAIN } from './dm-mgmt/index.ts'
import { HTN_CONTROL_DOMAIN } from './htn-control/index.ts'

export const DOMAIN_REGISTRY: ReadonlyArray<ClinicalDomain> = [
  HF_GDMT_DOMAIN,
  ACS_SECONDARY_DOMAIN,
  DM_MGMT_DOMAIN,
  HTN_CONTROL_DOMAIN,
]

export function getDomain(id: string): ClinicalDomain | undefined {
  return DOMAIN_REGISTRY.find((domain) => domain.id === id)
}

export function getActiveDomains(): ReadonlyArray<ClinicalDomain> {
  return DOMAIN_REGISTRY.filter((domain) => domain.status === 'active')
}
