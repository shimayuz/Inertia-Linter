import type { AuditResult, PillarResult } from '../types/audit.ts'
import type { SharedDecisionContext, DecisionOption } from '../types/patient-view.ts'
import type { Pillar } from '../types/pillar.ts'
import type { BlockerCode } from '../types/blocker.ts'
import { PILLAR_LABELS } from '../types/pillar.ts'

const HARD_EXCLUSION_BLOCKERS: ReadonlyArray<BlockerCode> = [
  'CONTRAINDICATED' as BlockerCode,
  'ALLERGY',
]

function isHardExcluded(blockers: ReadonlyArray<BlockerCode>): boolean {
  return blockers.some((b) => HARD_EXCLUSION_BLOCKERS.includes(b))
}

function isEligibleForDecisionAid(pillarResult: PillarResult): boolean {
  return (
    pillarResult.status === 'MISSING' &&
    !isHardExcluded(pillarResult.blockers)
  )
}

function buildHfArniOptions(): ReadonlyArray<DecisionOption> {
  return [
    {
      id: 'arni-option',
      title: 'ARNI (sacubitril/valsartan)',
      description: 'A combination medicine that helps your heart pump better and reduces strain on your heart.',
      pros: [
        'Strongest evidence for improving heart function',
        'Reduces hospitalization risk',
        'Single combination pill',
      ],
      cons: [
        'May lower blood pressure',
        'Cannot be taken with ACE inhibitors',
        'Higher cost than older alternatives',
      ],
      costEstimate: '$$$',
      evidenceLevel: 'Strong (Class I)',
    },
    {
      id: 'acei-option',
      title: 'ACE inhibitor (e.g., enalapril)',
      description: 'A well-established medicine that relaxes blood vessels and reduces the workload on your heart.',
      pros: [
        'Decades of evidence',
        'Well-understood side effects',
        'Generic options available (lower cost)',
      ],
      cons: [
        'May cause dry cough',
        'May lower blood pressure',
        'Less effective than ARNI in head-to-head trials',
      ],
      costEstimate: '$',
      evidenceLevel: 'Strong (Class I)',
    },
    {
      id: 'arb-option',
      title: 'ARB (e.g., valsartan, losartan)',
      description: 'Similar to ACE inhibitors but typically better tolerated, especially if cough is a concern.',
      pros: [
        'Good alternative if ACE inhibitor causes cough',
        'Generic options available',
        'Well-tolerated',
      ],
      cons: [
        'May lower blood pressure',
        'Slightly less evidence than ACE inhibitors for heart failure',
      ],
      costEstimate: '$',
      evidenceLevel: 'Strong (Class I)',
    },
  ]
}

function buildHfBetaBlockerOptions(): ReadonlyArray<DecisionOption> {
  return [
    {
      id: 'carvedilol-option',
      title: 'Carvedilol',
      description: 'A beta-blocker that slows your heart rate and helps your heart pump more efficiently.',
      pros: [
        'Strong evidence for heart failure',
        'Also helps with blood pressure',
        'Generic available',
      ],
      cons: [
        'May cause fatigue or dizziness',
        'Needs to be taken twice daily',
        'May worsen asthma',
      ],
      costEstimate: '$',
      evidenceLevel: 'Strong (Class I)',
    },
    {
      id: 'metoprolol-option',
      title: 'Metoprolol succinate (extended release)',
      description: 'A once-daily beta-blocker with strong evidence for heart failure treatment.',
      pros: [
        'Once-daily dosing',
        'Strong evidence for heart failure',
        'Generic available',
      ],
      cons: [
        'May cause fatigue or dizziness',
        'May worsen asthma',
      ],
      costEstimate: '$',
      evidenceLevel: 'Strong (Class I)',
    },
  ]
}

function buildHfMraOptions(): ReadonlyArray<DecisionOption> {
  return [
    {
      id: 'spironolactone-option',
      title: 'Spironolactone',
      description: 'A medicine that blocks a hormone contributing to heart damage and fluid retention.',
      pros: [
        'Reduces hospitalization and improves survival',
        'Helps with fluid balance',
        'Generic available (low cost)',
      ],
      cons: [
        'Requires monitoring of potassium levels',
        'May cause breast tenderness in men',
        'Not suitable if potassium is already high',
      ],
      costEstimate: '$',
      evidenceLevel: 'Strong (Class I)',
    },
    {
      id: 'eplerenone-option',
      title: 'Eplerenone',
      description: 'Similar to spironolactone but with fewer hormonal side effects.',
      pros: [
        'Fewer hormonal side effects than spironolactone',
        'Reduces hospitalization and improves survival',
      ],
      cons: [
        'Requires monitoring of potassium levels',
        'Higher cost than spironolactone',
        'Not suitable if potassium is already high',
      ],
      costEstimate: '$$',
      evidenceLevel: 'Strong (Class I)',
    },
  ]
}

function buildHfSglt2iOptions(): ReadonlyArray<DecisionOption> {
  return [
    {
      id: 'dapagliflozin-option',
      title: 'Dapagliflozin (Farxiga)',
      description: 'A newer medicine that helps your kidneys remove extra sugar and fluid, reducing strain on your heart.',
      pros: [
        'Reduces hospitalization for heart failure',
        'Also protects kidney function',
        'Benefits seen regardless of diabetes status',
      ],
      cons: [
        'May increase risk of urinary tract infections',
        'May cause genital yeast infections',
        'Higher cost (brand name)',
      ],
      costEstimate: '$$$',
      evidenceLevel: 'Strong (Class I)',
    },
    {
      id: 'empagliflozin-option',
      title: 'Empagliflozin (Jardiance)',
      description: 'Another SGLT2 inhibitor with similar benefits for heart failure management.',
      pros: [
        'Reduces hospitalization for heart failure',
        'Kidney-protective effects',
        'Once-daily dosing',
      ],
      cons: [
        'May increase risk of urinary tract infections',
        'May cause genital yeast infections',
        'Higher cost (brand name)',
      ],
      costEstimate: '$$$',
      evidenceLevel: 'Strong (Class I)',
    },
  ]
}

function buildDmSglt2iOptions(): ReadonlyArray<DecisionOption> {
  return [
    {
      id: 'sglt2i-dm-option',
      title: 'SGLT2 inhibitor',
      description: 'Helps lower blood sugar by helping your kidneys remove extra sugar. Also protects your heart and kidneys.',
      pros: [
        'Lowers blood sugar without causing low blood sugar',
        'Promotes modest weight loss',
        'Protects heart and kidneys',
      ],
      cons: [
        'May increase risk of urinary tract infections',
        'May cause genital yeast infections',
        'Higher cost than older diabetes medications',
      ],
      costEstimate: '$$$',
      evidenceLevel: 'Strong (ADA Class A)',
    },
    {
      id: 'glp1ra-dm-option',
      title: 'GLP-1 receptor agonist',
      description: 'An injectable or oral medicine that helps your body produce more insulin when needed and reduces appetite.',
      pros: [
        'Significant weight loss benefit',
        'Cardiovascular protection',
        'Low risk of causing low blood sugar',
      ],
      cons: [
        'May cause nausea initially',
        'Most are injectable',
        'Higher cost',
      ],
      costEstimate: '$$$',
      evidenceLevel: 'Strong (ADA Class A)',
    },
  ]
}

function buildHtnAceiArbOptions(): ReadonlyArray<DecisionOption> {
  return [
    {
      id: 'acei-htn-option',
      title: 'ACE inhibitor',
      description: 'Relaxes blood vessels to lower blood pressure. Especially beneficial if you also have diabetes or kidney disease.',
      pros: [
        'First-line therapy for high blood pressure',
        'Protects kidneys in diabetes',
        'Generic available (low cost)',
      ],
      cons: [
        'May cause dry cough',
        'Requires monitoring of kidney function',
        'Cannot be used during pregnancy',
      ],
      costEstimate: '$',
      evidenceLevel: 'Strong (JNC/AHA Class I)',
    },
    {
      id: 'arb-htn-option',
      title: 'ARB',
      description: 'Similar to ACE inhibitors but typically better tolerated. A good alternative if cough occurs with ACE inhibitors.',
      pros: [
        'Well-tolerated (less cough than ACE inhibitors)',
        'First-line therapy for high blood pressure',
        'Generic available',
      ],
      cons: [
        'Cannot be combined with ACE inhibitors',
        'Requires monitoring of kidney function',
        'Cannot be used during pregnancy',
      ],
      costEstimate: '$',
      evidenceLevel: 'Strong (JNC/AHA Class I)',
    },
  ]
}

function buildHtnCcbOptions(): ReadonlyArray<DecisionOption> {
  return [
    {
      id: 'ccb-option',
      title: 'Calcium channel blocker (e.g., amlodipine)',
      description: 'Relaxes blood vessels by blocking calcium from entering muscle cells in vessel walls.',
      pros: [
        'Effective blood pressure lowering',
        'Can be used in combination with other medications',
        'Generic available (low cost)',
      ],
      cons: [
        'May cause ankle swelling',
        'May cause headaches initially',
        'Some types should be avoided with certain heart conditions',
      ],
      costEstimate: '$',
      evidenceLevel: 'Strong (JNC/AHA Class I)',
    },
  ]
}

function getOptionsForPillar(pillar: Pillar, domainId?: string): ReadonlyArray<DecisionOption> {
  if (domainId === 'dm-mgmt') {
    if (pillar === 'SGLT2i_DM' || pillar === 'GLP1_RA') {
      return buildDmSglt2iOptions()
    }
    return []
  }

  if (domainId === 'htn-control') {
    if (pillar === 'ACEi_ARB_HTN') {
      return buildHtnAceiArbOptions()
    }
    if (pillar === 'CCB') {
      return buildHtnCcbOptions()
    }
    return []
  }

  if (pillar === 'ARNI_ACEi_ARB') {
    return buildHfArniOptions()
  }
  if (pillar === 'BETA_BLOCKER') {
    return buildHfBetaBlockerOptions()
  }
  if (pillar === 'MRA') {
    return buildHfMraOptions()
  }
  if (pillar === 'SGLT2i') {
    return buildHfSglt2iOptions()
  }

  return []
}

function getRiskWithout(pillar: Pillar, domainId?: string): string {
  if (domainId === 'dm-mgmt') {
    return 'Without optimized diabetes management, the risk of heart disease, kidney disease, and other complications increases over time.'
  }
  if (domainId === 'htn-control') {
    return 'Uncontrolled blood pressure increases your risk of heart attack, stroke, and kidney damage over time.'
  }

  const pillarLabel = PILLAR_LABELS[pillar]
  return `Without ${pillarLabel}, heart failure may progress more quickly, increasing the risk of hospitalization and reduced quality of life.`
}

function getBenefitWith(pillar: Pillar, domainId?: string): string {
  if (domainId === 'dm-mgmt') {
    return 'Each additional effective therapy reduces the risk of diabetes complications and can improve your day-to-day energy and well-being.'
  }
  if (domainId === 'htn-control') {
    return 'Reaching blood pressure goals significantly reduces your risk of stroke, heart attack, and kidney disease.'
  }

  const pillarLabel = PILLAR_LABELS[pillar]
  return `Adding ${pillarLabel} to your treatment plan may reduce hospitalization risk and help your heart function more effectively.`
}

function buildQuestionForPillar(pillar: Pillar, domainId?: string): string {
  const pillarLabel = PILLAR_LABELS[pillar]

  if (domainId === 'dm-mgmt') {
    return `Would adding a new diabetes medication be right for you?`
  }
  if (domainId === 'htn-control') {
    return `Should we consider starting ${pillarLabel} for blood pressure control?`
  }

  return `Should we consider starting ${pillarLabel} for your heart?`
}

export function generateSharedDecisions(
  auditResult: AuditResult,
): ReadonlyArray<SharedDecisionContext> {
  const contexts: Array<SharedDecisionContext> = []

  for (const pillarResult of auditResult.pillarResults) {
    if (!isEligibleForDecisionAid(pillarResult)) {
      continue
    }

    const options = getOptionsForPillar(pillarResult.pillar, auditResult.domainId)
    if (options.length === 0) {
      continue
    }

    contexts.push({
      pillar: pillarResult.pillar,
      currentStatus: pillarResult.status,
      question: buildQuestionForPillar(pillarResult.pillar, auditResult.domainId),
      options,
      riskWithout: getRiskWithout(pillarResult.pillar, auditResult.domainId),
      benefitWith: getBenefitWith(pillarResult.pillar, auditResult.domainId),
    })
  }

  return contexts
}
