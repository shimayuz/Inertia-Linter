import type { Pillar } from '../types/pillar.ts'

export interface PATemplate {
  readonly pillar: Pillar
  readonly drugClass: string
  readonly justificationTemplate: string
  readonly guidelineReference: string
  readonly guidelineClass: string
  readonly guidelineDOI: string
  readonly stepTherapyExceptionTemplate: string
}

export const PA_TEMPLATES: Readonly<Record<Pillar, PATemplate>> = {
  ARNI_ACEi_ARB: {
    pillar: 'ARNI_ACEi_ARB',
    drugClass: 'Angiotensin receptor-neprilysin inhibitor (ARNI)',
    justificationTemplate:
      'Patient has heart failure with reduced ejection fraction (EF {{ef}}%, NYHA Class {{nyha}}). ' +
      'ARNI (sacubitril/valsartan) is recommended by AHA/ACC/HFSA 2022 Guidelines (Class I, LOE B-R) ' +
      'to reduce morbidity and mortality. PARADIGM-HF demonstrated 20% reduction in cardiovascular death ' +
      'and heart failure hospitalization compared to enalapril. Patient has no contraindications to ARNI initiation.',
    guidelineReference: 'AHA/ACC/HFSA 2022 Guideline for the Management of Heart Failure',
    guidelineClass: 'Class I, Level of Evidence B-R',
    guidelineDOI: '10.1161/CIR.0000000000001063',
    stepTherapyExceptionTemplate:
      'Step therapy exception is requested based on: (1) Patient was initiated on ARNI during index hospitalization ' +
      'and demonstrated tolerability; (2) Interruption of evidence-based therapy during care transition poses risk of ' +
      'heart failure decompensation and rehospitalization; (3) AHA/ACC/HFSA guidelines recommend ARNI as preferred ' +
      'RAAS inhibitor in HFrEF (Class I, LOE B-R). Requiring ACEi step therapy delays access to superior evidence-based treatment.',
  },
  BETA_BLOCKER: {
    pillar: 'BETA_BLOCKER',
    drugClass: 'Evidence-based beta-blocker',
    justificationTemplate:
      'Patient has heart failure with reduced ejection fraction (EF {{ef}}%, NYHA Class {{nyha}}). ' +
      'Evidence-based beta-blocker is recommended by AHA/ACC/HFSA 2022 Guidelines (Class I, LOE A) ' +
      'to reduce mortality. Only carvedilol, metoprolol succinate, and bisoprolol have mortality benefit in HFrEF.',
    guidelineReference: 'AHA/ACC/HFSA 2022 Guideline for the Management of Heart Failure',
    guidelineClass: 'Class I, Level of Evidence A',
    guidelineDOI: '10.1161/CIR.0000000000001063',
    stepTherapyExceptionTemplate:
      'Only 3 beta-blockers have demonstrated mortality benefit in HFrEF: carvedilol, metoprolol succinate, ' +
      'and bisoprolol. Substitution with non-evidence-based beta-blockers is not clinically equivalent.',
  },
  MRA: {
    pillar: 'MRA',
    drugClass: 'Mineralocorticoid receptor antagonist (MRA)',
    justificationTemplate:
      'Patient has heart failure with reduced ejection fraction (EF {{ef}}%, NYHA Class {{nyha}}). ' +
      'MRA is recommended by AHA/ACC/HFSA 2022 Guidelines (Class I, LOE A) to reduce morbidity and mortality. ' +
      'RALES demonstrated 30% reduction in mortality with spironolactone. Patient eGFR {{egfr}} and K+ {{potassium}} ' +
      'are within safe range for MRA initiation.',
    guidelineReference: 'AHA/ACC/HFSA 2022 Guideline for the Management of Heart Failure',
    guidelineClass: 'Class I, Level of Evidence A',
    guidelineDOI: '10.1161/CIR.0000000000001063',
    stepTherapyExceptionTemplate:
      'Spironolactone and eplerenone are guideline-recommended MRAs. Generic spironolactone is available ' +
      'at $4/month and does not typically require prior authorization.',
  },
  SGLT2i: {
    pillar: 'SGLT2i',
    drugClass: 'Sodium-glucose co-transporter 2 inhibitor (SGLT2i)',
    justificationTemplate:
      'Patient has heart failure with reduced ejection fraction (EF {{ef}}%, NYHA Class {{nyha}}). ' +
      'SGLT2i is recommended by AHA/ACC/HFSA 2022 Guidelines (Class I, LOE A) and ACC ECDP 2024 ' +
      'to reduce hospitalization and cardiovascular mortality regardless of diabetes status. ' +
      'DAPA-HF and EMPEROR-Reduced demonstrated significant outcome improvement in HFrEF.',
    guidelineReference: 'AHA/ACC/HFSA 2022 Guideline + ACC ECDP 2024 for SGLT2i',
    guidelineClass: 'Class I, Level of Evidence A',
    guidelineDOI: '10.1161/CIR.0000000000001063',
    stepTherapyExceptionTemplate:
      'SGLT2i use for heart failure is independent of glycemic control and should not be subject ' +
      'to diabetes-specific step therapy requirements. ACC ECDP 2024 specifically recommends SGLT2i ' +
      'for HF regardless of diabetes status.',
  },
} as const

export function fillTemplate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  let result = template
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
  }
  return result
}
