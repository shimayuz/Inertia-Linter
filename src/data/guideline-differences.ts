import type { GuidelineComparison } from '../types/guideline'

export const guidelineDifferences: ReadonlyArray<GuidelineComparison> = [
  {
    topic: 'SGLT2i in HFpEF',
    positions: [
      {
        source: 'AHA',
        class: '2a',
        loe: 'B',
        year: 2022,
        doi: '10.1161/CIR.0000000000001063',
      },
      {
        source: 'ESC',
        class: 'I',
        loe: 'A',
        year: 2023,
        doi: '10.1093/eurheartj/ehad195',
      },
    ],
    hasDifference: true,
  },
  {
    topic: 'Finerenone in HFmrEF/HFpEF',
    positions: [
      {
        source: 'ESC',
        class: 'IIa',
        loe: 'B',
        year: 2024,
        doi: '10.1093/eurheartj/ehae600',
        note: 'Based on FINEARTS-HF trial; requires T2DM',
      },
      {
        source: 'AHA',
        class: 'Not yet graded',
        loe: '-',
        year: 2022,
        doi: '10.1161/CIR.0000000000001063',
        note: 'Pre-dates FINEARTS-HF evidence',
      },
    ],
    hasDifference: true,
  },
  {
    topic: 'ARNI vs ACEi first-line in HFrEF',
    positions: [
      {
        source: 'AHA',
        class: 'I',
        loe: 'A',
        year: 2022,
        doi: '10.1161/CIR.0000000000001063',
        note: 'ARNI or ACEi (can use either)',
      },
      {
        source: 'ESC',
        class: 'I',
        loe: 'B-R',
        year: 2021,
        doi: '10.1093/eurheartj/ehab368',
        note: 'Prefers ARNI over ACEi (stronger recommendation)',
      },
    ],
    hasDifference: true,
  },
  {
    topic: 'Rapid sequence initiation',
    positions: [
      {
        source: 'AHA',
        class: 'I',
        loe: 'C-EO',
        year: 2023,
        doi: '10.1016/j.jacc.2023.10.024',
        note: 'ACC ECDP supports rapid initiation of all 4 pillars',
      },
      {
        source: 'ESC',
        class: 'I',
        loe: 'C-EO',
        year: 2021,
        doi: '10.1093/eurheartj/ehab368',
        note: 'Supports early combination but less prescriptive on sequence',
      },
    ],
    hasDifference: false,
  },
]
