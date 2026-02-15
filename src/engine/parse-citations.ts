import type { Citation } from '../types/chat.ts'

interface ParsedContent {
  readonly text: string
  readonly citations: ReadonlyArray<Citation>
}

const CITATION_REGEX = /\[(guideline|trial|patient):([^\]]+)\]/g

const PATIENT_LABEL_MAP: Readonly<Record<string, string>> = {
  egfr: 'eGFR',
  sbp: 'SBP',
  hr: 'HR',
  ef: 'EF',
  potassium: 'K+',
  k: 'K+',
  nyha: 'NYHA',
  bnp: 'BNP',
  ntprobnp: 'NT-proBNP',
}

function formatGuidelineLabel(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/(\D)(\d)/g, '$1 $2')
}

function formatCitationLabel(type: Citation['type'], id: string): string {
  if (type === 'patient') {
    const lower = id.toLowerCase()
    return PATIENT_LABEL_MAP[lower] ?? id.toUpperCase()
  }
  if (type === 'guideline') {
    return formatGuidelineLabel(id)
  }
  return id
}

const SUPERSCRIPT_DIGITS: ReadonlyArray<string> = [
  '\u2070', '\u00B9', '\u00B2', '\u00B3', '\u2074',
  '\u2075', '\u2076', '\u2077', '\u2078', '\u2079',
]

function toSuperscript(n: number): string {
  if (n < 10) {
    return SUPERSCRIPT_DIGITS[n]
  }
  return String(n)
    .split('')
    .map((digit) => SUPERSCRIPT_DIGITS[Number(digit)])
    .join('')
}

export function parseCitations(raw: string): ParsedContent {
  const citationMap = new Map<string, { citation: Citation; index: number }>()
  let citationCount = 0

  const matches = Array.from(raw.matchAll(CITATION_REGEX))

  for (const match of matches) {
    const type = match[1] as Citation['type']
    const id = match[2]
    const key = `${type}:${id}`

    if (!citationMap.has(key)) {
      citationCount += 1
      citationMap.set(key, {
        citation: {
          type,
          id,
          label: formatCitationLabel(type, id),
        },
        index: citationCount,
      })
    }
  }

  const text = raw.replace(CITATION_REGEX, (_fullMatch, type: string, id: string) => {
    const key = `${type}:${id}`
    const entry = citationMap.get(key)
    if (!entry) {
      return _fullMatch
    }
    return `${entry.citation.label}${toSuperscript(entry.index)}`
  })

  const citations: ReadonlyArray<Citation> = Array.from(citationMap.values())
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.citation)

  return { text, citations }
}
