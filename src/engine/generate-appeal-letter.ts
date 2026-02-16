import type { PAFormData, GeneratedDocument } from '../types/resolution.ts'
import { PA_TEMPLATES } from '../data/pa-form-templates.ts'
import { PILLAR_LABELS } from '../types/pillar.ts'

// ---------------------------------------------------------------------------
// Appeal letter generator (template-based, no LLM)
// ---------------------------------------------------------------------------

function buildAppealBody(paForm: PAFormData, denialReason?: string): string {
  const template = PA_TEMPLATES[paForm.requestedDrugPillar]
  if (!template) {
    throw new Error(`PA form template not available for pillar: ${paForm.requestedDrugPillar}`)
  }
  const pillarLabel = PILLAR_LABELS[paForm.requestedDrugPillar]
  const sections: Array<string> = []

  sections.push('APPEAL FOR PRIOR AUTHORIZATION')
  sections.push(`Date: ${new Date().toISOString().slice(0, 10)}`)
  sections.push('')

  if (paForm.insurance.payerName) {
    sections.push(`To: ${paForm.insurance.payerName}`)
    if (paForm.insurance.memberId) {
      sections.push(`Member ID: ${paForm.insurance.memberId}`)
    }
    if (paForm.insurance.groupNumber) {
      sections.push(`Group: ${paForm.insurance.groupNumber}`)
    }
    sections.push('')
  }

  sections.push(`Re: Appeal for ${paForm.requestedDrug} (${pillarLabel})`)
  sections.push(`Diagnosis: ${paForm.diagnosisCode} - ${paForm.diagnosisDescription}`)
  sections.push('')

  if (denialReason) {
    sections.push(`Denial Reason: ${denialReason}`)
    sections.push('')
  }

  sections.push('CLINICAL JUSTIFICATION:')
  sections.push(paForm.clinicalJustification)
  sections.push('')

  sections.push('GUIDELINE SUPPORT:')
  sections.push(`${template.guidelineReference}`)
  sections.push(`Classification: ${template.guidelineClass}`)
  sections.push(`DOI: ${template.guidelineDOI}`)
  sections.push('')

  sections.push('PATIENT CLINICAL DATA:')
  sections.push(`- Ejection Fraction: ${String(paForm.efPercent)}%`)
  sections.push(`- NYHA Functional Class: ${String(paForm.nyhaClass)}`)

  for (const lab of paForm.relevantLabs) {
    sections.push(`- ${lab.name}: ${String(lab.value)} ${lab.unit} (${lab.date})`)
  }
  sections.push('')

  if (paForm.priorTrials.length > 0) {
    sections.push('PRIOR DRUG TRIALS:')
    for (const trial of paForm.priorTrials) {
      const duration = `${String(trial.durationDays)} days`
      const endInfo = trial.endDate ? ` to ${trial.endDate}` : ' (ongoing)'
      sections.push(
        `- ${trial.drugName}: ${trial.startDate}${endInfo} (${duration}) - Outcome: ${trial.outcome}${
          trial.reasonStopped ? ` (${trial.reasonStopped})` : ''
        }`,
      )
    }
    sections.push('')
  }

  sections.push(
    'Based on the above clinical evidence and national guideline recommendations, ' +
    'we respectfully request reconsideration of this prior authorization decision. ' +
    `${paForm.requestedDrug} is the guideline-directed therapy for this patient's condition ` +
    'and denial of coverage may result in increased risk of hospitalization and adverse outcomes.',
  )
  sections.push('')

  if (paForm.prescriber.name) {
    sections.push(`Sincerely,`)
    sections.push(paForm.prescriber.name)
    if (paForm.prescriber.specialty) {
      sections.push(paForm.prescriber.specialty)
    }
    if (paForm.prescriber.npi) {
      sections.push(`NPI: ${paForm.prescriber.npi}`)
    }
    if (paForm.prescriber.phone) {
      sections.push(`Phone: ${paForm.prescriber.phone}`)
    }
    if (paForm.prescriber.fax) {
      sections.push(`Fax: ${paForm.prescriber.fax}`)
    }
  }

  return sections.join('\n')
}

export function generateAppealLetter(
  paForm: PAFormData,
  denialReason?: string,
): GeneratedDocument {
  const content = buildAppealBody(paForm, denialReason)

  return {
    type: 'appeal_letter',
    title: `PA Appeal - ${paForm.requestedDrug}`,
    generatedAt: new Date().toISOString(),
    content,
    requiresReview: true,
    isApproved: false,
  }
}
