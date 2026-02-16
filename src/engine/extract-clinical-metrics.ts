import type { PatientSnapshot } from '../types/patient.ts'
import type { ClinicalMetric, MetricStatus, MetricTarget } from '../types/patient-view.ts'

function classifyMetricStatus(
  value: number | undefined,
  target: MetricTarget | undefined,
): MetricStatus {
  if (value === undefined || target === undefined) {
    return 'unknown'
  }

  const { min, max, nearMin, nearMax } = target

  const inTarget =
    (min === undefined || value >= min) &&
    (max === undefined || value < max)

  if (inTarget) {
    return 'at_target'
  }

  const inNear =
    (nearMin !== undefined && nearMax !== undefined) &&
    value >= nearMin && value < nearMax

  if (inNear) {
    return 'near_target'
  }

  return 'off_target'
}

function classifyRangeStatus(
  value: number | undefined,
  targetMin: number,
  targetMax: number,
  nearLow: number,
  nearHigh: number,
): MetricStatus {
  if (value === undefined) {
    return 'unknown'
  }
  if (value >= targetMin && value <= targetMax) {
    return 'at_target'
  }
  if (value >= nearLow && value <= nearHigh) {
    return 'near_target'
  }
  return 'off_target'
}

function classifyBPStatus(
  sbp: number | undefined,
  dbp: number | undefined,
  targetSBP: number,
  targetDBP: number,
  nearSBP: number,
  nearDBP: number,
): MetricStatus {
  if (sbp === undefined) {
    return 'unknown'
  }
  if (sbp < targetSBP && (dbp === undefined || dbp < targetDBP)) {
    return 'at_target'
  }
  if (sbp <= nearSBP && (dbp === undefined || dbp <= nearDBP)) {
    return 'near_target'
  }
  return 'off_target'
}

function extractDMMetrics(patient: PatientSnapshot): ReadonlyArray<ClinicalMetric> {
  const hba1cTarget: MetricTarget = {
    label: '< 7.0%',
    max: 7.0,
    nearMin: 7.0,
    nearMax: 8.0,
  }

  const fgTarget: MetricTarget = {
    label: '80-130 mg/dL',
    min: 80,
    max: 131,
    nearMin: 130,
    nearMax: 181,
  }

  const bmiTarget: MetricTarget = {
    label: '18.5-25 kg/m\u00B2',
    min: 18.5,
    max: 25.01,
    nearMin: 25,
    nearMax: 30.01,
  }

  const egfrTarget: MetricTarget = {
    label: '\u2265 60 mL/min',
    min: 60,
    nearMin: 45,
    nearMax: 60,
  }

  return Object.freeze([
    {
      id: 'dm.hba1c',
      label: 'metrics.dm.hba1c',
      value: patient.hba1c,
      unit: '%',
      target: hba1cTarget,
      status: classifyMetricStatus(patient.hba1c, hba1cTarget),
      isPrimary: true,
    },
    {
      id: 'dm.fastingGlucose',
      label: 'metrics.dm.fastingGlucose',
      value: patient.fastingGlucose,
      unit: 'mg/dL',
      target: fgTarget,
      status: classifyMetricStatus(patient.fastingGlucose, fgTarget),
      isPrimary: false,
    },
    {
      id: 'dm.bmi',
      label: 'metrics.dm.bmi',
      value: patient.bmi,
      unit: 'kg/m\u00B2',
      target: bmiTarget,
      status: classifyMetricStatus(patient.bmi, bmiTarget),
      isPrimary: false,
    },
    {
      id: 'dm.egfr',
      label: 'metrics.dm.egfr',
      value: patient.egfr,
      unit: 'mL/min',
      target: egfrTarget,
      status: classifyMetricStatus(patient.egfr, egfrTarget),
      isPrimary: false,
    },
  ])
}

function extractHTNMetrics(patient: PatientSnapshot): ReadonlyArray<ClinicalMetric> {
  const targetSBP = patient.targetSBP ?? 130
  const targetDBP = patient.targetDBP ?? 80
  const nearSBP = targetSBP + 10
  const nearDBP = targetDBP + 10

  const bpTarget: MetricTarget = {
    label: `< ${targetSBP}/${targetDBP} mmHg`,
  }

  const egfrTarget: MetricTarget = {
    label: '\u2265 60 mL/min',
    min: 60,
    nearMin: 45,
    nearMax: 60,
  }

  const kTarget: MetricTarget = {
    label: '3.5-5.0 mEq/L',
    min: 3.5,
    max: 5.01,
  }

  const hrTarget: MetricTarget = {
    label: '60-100 bpm',
    min: 60,
    max: 101,
  }

  return Object.freeze([
    {
      id: 'htn.bp',
      label: 'metrics.htn.bp',
      value: patient.sbp,
      unit: 'mmHg',
      target: bpTarget,
      status: classifyBPStatus(patient.sbp, patient.dbp, targetSBP, targetDBP, nearSBP, nearDBP),
      isPrimary: true,
      secondaryValue: patient.dbp,
      secondaryUnit: 'mmHg',
    },
    {
      id: 'htn.egfr',
      label: 'metrics.htn.egfr',
      value: patient.egfr,
      unit: 'mL/min',
      target: egfrTarget,
      status: classifyMetricStatus(patient.egfr, egfrTarget),
      isPrimary: false,
    },
    {
      id: 'htn.potassium',
      label: 'metrics.htn.potassium',
      value: patient.potassium,
      unit: 'mEq/L',
      target: kTarget,
      status: classifyRangeStatus(patient.potassium, 3.5, 5.0, 3.0, 5.5),
      isPrimary: false,
    },
    {
      id: 'htn.hr',
      label: 'metrics.htn.hr',
      value: patient.hr,
      unit: 'bpm',
      target: hrTarget,
      status: classifyRangeStatus(patient.hr, 60, 100, 50, 110),
      isPrimary: false,
    },
  ])
}

function extractHFMetrics(patient: PatientSnapshot): ReadonlyArray<ClinicalMetric> {
  const efTarget: MetricTarget = {
    label: '> 40%',
    min: 41,
    nearMin: 35,
    nearMax: 41,
  }

  const sbpTarget: MetricTarget = {
    label: '90-130 mmHg',
    min: 90,
    max: 131,
  }

  const hrTarget: MetricTarget = {
    label: '60-80 bpm',
    min: 60,
    max: 81,
  }

  const egfrTarget: MetricTarget = {
    label: '\u2265 30 mL/min',
    min: 30,
    nearMin: 20,
    nearMax: 30,
  }

  const kTarget: MetricTarget = {
    label: '3.5-5.0 mEq/L',
    min: 3.5,
    max: 5.01,
    nearMin: 5.0,
    nearMax: 5.51,
  }

  const hasBNP = patient.bnp !== undefined
  const hasNTproBNP = patient.ntProBnp !== undefined

  const biomarkerMetric: ClinicalMetric = hasBNP
    ? {
        id: 'hf.bnp',
        label: 'metrics.hf.bnp',
        value: patient.bnp,
        unit: 'pg/mL',
        target: { label: '< 100 pg/mL', max: 100, nearMin: 100, nearMax: 400 },
        status: classifyMetricStatus(patient.bnp, { label: '< 100 pg/mL', max: 100, nearMin: 100, nearMax: 400 }),
        isPrimary: false,
      }
    : hasNTproBNP
      ? {
          id: 'hf.ntProBnp',
          label: 'metrics.hf.ntProBnp',
          value: patient.ntProBnp,
          unit: 'pg/mL',
          target: { label: '< 300 pg/mL', max: 300, nearMin: 300, nearMax: 900 },
          status: classifyMetricStatus(patient.ntProBnp, { label: '< 300 pg/mL', max: 300, nearMin: 300, nearMax: 900 }),
          isPrimary: false,
        }
      : {
          id: 'hf.bnp',
          label: 'metrics.hf.bnp',
          value: undefined,
          unit: 'pg/mL',
          target: { label: '< 100 pg/mL', max: 100, nearMin: 100, nearMax: 400 },
          status: 'unknown' as const,
          isPrimary: false,
        }

  return Object.freeze([
    {
      id: 'hf.ef',
      label: 'metrics.hf.ef',
      value: patient.ef,
      unit: '%',
      target: efTarget,
      status: classifyMetricStatus(patient.ef, efTarget),
      isPrimary: true,
    },
    {
      id: 'hf.sbp',
      label: 'metrics.hf.sbp',
      value: patient.sbp,
      unit: 'mmHg',
      target: sbpTarget,
      status: classifyRangeStatus(patient.sbp, 90, 130, 85, 140),
      isPrimary: false,
    },
    {
      id: 'hf.hr',
      label: 'metrics.hf.hr',
      value: patient.hr,
      unit: 'bpm',
      target: hrTarget,
      status: classifyRangeStatus(patient.hr, 60, 80, 55, 90),
      isPrimary: false,
    },
    {
      id: 'hf.egfr',
      label: 'metrics.hf.egfr',
      value: patient.egfr,
      unit: 'mL/min',
      target: egfrTarget,
      status: classifyMetricStatus(patient.egfr, egfrTarget),
      isPrimary: false,
    },
    {
      id: 'hf.potassium',
      label: 'metrics.hf.potassium',
      value: patient.potassium,
      unit: 'mEq/L',
      target: kTarget,
      status: classifyMetricStatus(patient.potassium, kTarget),
      isPrimary: false,
    },
    biomarkerMetric,
  ])
}

export function extractClinicalMetrics(
  patient: PatientSnapshot,
  domainId?: string,
): ReadonlyArray<ClinicalMetric> {
  const resolvedDomain = domainId ?? patient.domainId ?? 'hf-gdmt'

  switch (resolvedDomain) {
    case 'dm-mgmt':
      return extractDMMetrics(patient)
    case 'htn-control':
      return extractHTNMetrics(patient)
    default:
      return extractHFMetrics(patient)
  }
}
