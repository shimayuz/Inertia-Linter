import type { Pillar } from '../types/pillar'
import type { DrugTargetDose } from '../types/target-dose'

const AHA_2022 = 'AHA/ACC/HFSA 2022'
const AHA_2022_DOI = '10.1161/CIR.0000000000001063'
const ESC_2021 = 'ESC 2021'
const ESC_2021_DOI = '10.1093/eurheartj/ehab368'
const ACC_ECDP_2024 = 'ACC ECDP 2024'
const ACC_ECDP_2024_DOI = '10.1016/j.jacc.2024.01.001'

const ARNI_ACEI_ARB_DRUGS: ReadonlyArray<DrugTargetDose> = [
  {
    drugName: 'Sacubitril/Valsartan',
    genericName: 'Sacubitril/Valsartan',
    brandName: 'Entresto',
    pillar: 'ARNI_ACEi_ARB',
    targetDose: '97/103mg BID',
    steps: [
      { label: '24/26mg BID', tier: 'LOW' },
      { label: '49/51mg BID', tier: 'MEDIUM' },
      { label: '97/103mg BID', tier: 'HIGH' },
    ],
    monitoringPerStep: [
      'BP, renal function, K+ at 1-2 weeks',
      'BP, renal function, K+ at 1-2 weeks',
      'BP, renal function, K+ at 1-2 weeks',
    ],
    titrationInterval: 'Every 2-4 weeks',
    guidelineSource: AHA_2022,
    doi: AHA_2022_DOI,
  },
  {
    drugName: 'Enalapril',
    genericName: 'Enalapril',
    pillar: 'ARNI_ACEi_ARB',
    targetDose: '10-20mg BID',
    steps: [
      { label: '2.5mg BID', tier: 'LOW' },
      { label: '5mg BID', tier: 'MEDIUM' },
      { label: '10-20mg BID', tier: 'HIGH' },
    ],
    monitoringPerStep: [
      'BP, renal function, K+ at 1-2 weeks',
      'BP, renal function, K+ at 1-2 weeks',
      'BP, renal function, K+ at 1-2 weeks',
    ],
    titrationInterval: 'Every 1-2 weeks',
    guidelineSource: AHA_2022,
    doi: AHA_2022_DOI,
  },
  {
    drugName: 'Lisinopril',
    genericName: 'Lisinopril',
    pillar: 'ARNI_ACEi_ARB',
    targetDose: '20-40mg daily',
    steps: [
      { label: '2.5-5mg daily', tier: 'LOW' },
      { label: '10-20mg daily', tier: 'MEDIUM' },
      { label: '20-40mg daily', tier: 'HIGH' },
    ],
    monitoringPerStep: [
      'BP, renal function, K+ at 1-2 weeks',
      'BP, renal function, K+ at 1-2 weeks',
      'BP, renal function, K+ at 1-2 weeks',
    ],
    titrationInterval: 'Every 1-2 weeks',
    guidelineSource: AHA_2022,
    doi: AHA_2022_DOI,
  },
  {
    drugName: 'Losartan',
    genericName: 'Losartan',
    pillar: 'ARNI_ACEi_ARB',
    targetDose: '150mg daily',
    steps: [
      { label: '25-50mg daily', tier: 'LOW' },
      { label: '100mg daily', tier: 'MEDIUM' },
      { label: '150mg daily', tier: 'HIGH' },
    ],
    monitoringPerStep: [
      'BP, renal function, K+ at 1-2 weeks',
      'BP, renal function, K+ at 1-2 weeks',
      'BP, renal function, K+ at 1-2 weeks',
    ],
    titrationInterval: 'Every 1-2 weeks',
    guidelineSource: AHA_2022,
    doi: AHA_2022_DOI,
  },
  {
    drugName: 'Valsartan',
    genericName: 'Valsartan',
    pillar: 'ARNI_ACEi_ARB',
    targetDose: '160mg BID',
    steps: [
      { label: '20-40mg BID', tier: 'LOW' },
      { label: '80mg BID', tier: 'MEDIUM' },
      { label: '160mg BID', tier: 'HIGH' },
    ],
    monitoringPerStep: [
      'BP, renal function, K+ at 1-2 weeks',
      'BP, renal function, K+ at 1-2 weeks',
      'BP, renal function, K+ at 1-2 weeks',
    ],
    titrationInterval: 'Every 1-2 weeks',
    guidelineSource: AHA_2022,
    doi: AHA_2022_DOI,
  },
  {
    drugName: 'Candesartan',
    genericName: 'Candesartan',
    pillar: 'ARNI_ACEi_ARB',
    targetDose: '32mg daily',
    steps: [
      { label: '4-8mg daily', tier: 'LOW' },
      { label: '16mg daily', tier: 'MEDIUM' },
      { label: '32mg daily', tier: 'HIGH' },
    ],
    monitoringPerStep: [
      'BP, renal function, K+ at 1-2 weeks',
      'BP, renal function, K+ at 1-2 weeks',
      'BP, renal function, K+ at 1-2 weeks',
    ],
    titrationInterval: 'Every 1-2 weeks',
    guidelineSource: ESC_2021,
    doi: ESC_2021_DOI,
  },
] as const

const BETA_BLOCKER_DRUGS: ReadonlyArray<DrugTargetDose> = [
  {
    drugName: 'Carvedilol',
    genericName: 'Carvedilol',
    pillar: 'BETA_BLOCKER',
    targetDose: '25mg BID',
    steps: [
      { label: '3.125mg BID', tier: 'LOW' },
      { label: '6.25mg BID', tier: 'LOW' },
      { label: '12.5mg BID', tier: 'MEDIUM' },
      { label: '25mg BID', tier: 'HIGH' },
    ],
    monitoringPerStep: [
      'HR, BP after 2 weeks',
      'HR, BP after 2 weeks',
      'HR, BP after 2 weeks',
      'HR, BP after 2 weeks',
    ],
    titrationInterval: 'Every 2 weeks',
    guidelineSource: AHA_2022,
    doi: AHA_2022_DOI,
  },
  {
    drugName: 'Metoprolol Succinate',
    genericName: 'Metoprolol Succinate',
    brandName: 'Toprol-XL',
    pillar: 'BETA_BLOCKER',
    targetDose: '200mg daily',
    steps: [
      { label: '12.5-25mg daily', tier: 'LOW' },
      { label: '50mg daily', tier: 'MEDIUM' },
      { label: '100mg daily', tier: 'MEDIUM' },
      { label: '200mg daily', tier: 'HIGH' },
    ],
    monitoringPerStep: [
      'HR, BP after 2 weeks',
      'HR, BP after 2 weeks',
      'HR, BP after 2 weeks',
      'HR, BP after 2 weeks',
    ],
    titrationInterval: 'Every 2 weeks',
    guidelineSource: AHA_2022,
    doi: AHA_2022_DOI,
  },
  {
    drugName: 'Bisoprolol',
    genericName: 'Bisoprolol',
    pillar: 'BETA_BLOCKER',
    targetDose: '10mg daily',
    steps: [
      { label: '1.25mg daily', tier: 'LOW' },
      { label: '2.5mg daily', tier: 'LOW' },
      { label: '5mg daily', tier: 'MEDIUM' },
      { label: '10mg daily', tier: 'HIGH' },
    ],
    monitoringPerStep: [
      'HR, BP after 2-4 weeks',
      'HR, BP after 2-4 weeks',
      'HR, BP after 2-4 weeks',
      'HR, BP after 2-4 weeks',
    ],
    titrationInterval: 'Every 2-4 weeks',
    guidelineSource: ESC_2021,
    doi: ESC_2021_DOI,
  },
] as const

const MRA_DRUGS: ReadonlyArray<DrugTargetDose> = [
  {
    drugName: 'Spironolactone',
    genericName: 'Spironolactone',
    pillar: 'MRA',
    targetDose: '50mg daily',
    steps: [
      { label: '12.5mg daily', tier: 'LOW' },
      { label: '25mg daily', tier: 'MEDIUM' },
      { label: '50mg daily', tier: 'HIGH' },
    ],
    monitoringPerStep: [
      'K+, renal function at 1 week, then 4 weeks',
      'K+, renal function at 4 weeks',
      'K+, renal function at 4 weeks',
    ],
    titrationInterval: 'Every 4-8 weeks',
    guidelineSource: AHA_2022,
    doi: AHA_2022_DOI,
  },
  {
    drugName: 'Eplerenone',
    genericName: 'Eplerenone',
    pillar: 'MRA',
    targetDose: '50mg daily',
    steps: [
      { label: '25mg daily', tier: 'MEDIUM' },
      { label: '50mg daily', tier: 'HIGH' },
    ],
    monitoringPerStep: [
      'K+, renal function at 1 week, then 4 weeks',
      'K+, renal function at 4 weeks',
    ],
    titrationInterval: 'Every 4-8 weeks',
    guidelineSource: AHA_2022,
    doi: AHA_2022_DOI,
  },
] as const

const SGLT2I_DRUGS: ReadonlyArray<DrugTargetDose> = [
  {
    drugName: 'Dapagliflozin',
    genericName: 'Dapagliflozin',
    brandName: 'Farxiga',
    pillar: 'SGLT2i',
    targetDose: '10mg daily',
    steps: [
      {
        label: '10mg daily',
        tier: 'HIGH',
        note: 'No titration required — start at target dose',
      },
    ],
    monitoringPerStep: ['Renal function, volume status at 1-3 months'],
    titrationInterval: 'No titration — single target dose',
    guidelineSource: ACC_ECDP_2024,
    doi: ACC_ECDP_2024_DOI,
  },
  {
    drugName: 'Empagliflozin',
    genericName: 'Empagliflozin',
    brandName: 'Jardiance',
    pillar: 'SGLT2i',
    targetDose: '10mg daily',
    steps: [
      {
        label: '10mg daily',
        tier: 'HIGH',
        note: 'No titration required — start at target dose',
      },
    ],
    monitoringPerStep: ['Renal function, volume status at 1-3 months'],
    titrationInterval: 'No titration — single target dose',
    guidelineSource: ACC_ECDP_2024,
    doi: ACC_ECDP_2024_DOI,
  },
] as const

export const TARGET_DOSES: Readonly<Record<Pillar, ReadonlyArray<DrugTargetDose>>> = {
  // Heart Failure
  ARNI_ACEi_ARB: ARNI_ACEI_ARB_DRUGS,
  BETA_BLOCKER: BETA_BLOCKER_DRUGS,
  MRA: MRA_DRUGS,
  SGLT2i: SGLT2I_DRUGS,
  // Diabetes Management (target doses TBD)
  METFORMIN: [],
  SGLT2i_DM: [],
  GLP1_RA: [],
  INSULIN: [],
  // Hypertension Control (target doses TBD)
  ACEi_ARB_HTN: [],
  CCB: [],
  THIAZIDE: [],
  BETA_BLOCKER_HTN: [],
} as const
