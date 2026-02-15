import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import type { MedicationDataPoint } from '../engine/timeline-transforms'
import { PILLARS, PILLAR_LABELS, type Pillar } from '../types/pillar'
import type { DoseTier } from '../types/dose-tier'

interface MedicationTimelineProps {
  readonly data: ReadonlyArray<MedicationDataPoint>
}

const DOSE_TIER_NUMERIC: Readonly<Record<DoseTier, number>> = {
  NOT_PRESCRIBED: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
}

const DOSE_TIER_COLORS: Readonly<Record<DoseTier, string>> = {
  NOT_PRESCRIBED: '#d1d5db',
  LOW: '#f59e0b',
  MEDIUM: '#3b82f6',
  HIGH: '#22c55e',
}

const PILLAR_KEYS = [
  PILLARS.ARNI_ACEi_ARB,
  PILLARS.BETA_BLOCKER,
  PILLARS.MRA,
  PILLARS.SGLT2i,
] as const

interface PivotedRow {
  readonly date: string
  readonly dateFormatted: string
  readonly [key: string]: string | number
}

type DoseTierI18nKey =
  | 'timeline.doseNotPrescribed'
  | 'timeline.doseLow'
  | 'timeline.doseMedium'
  | 'timeline.doseHigh'

const DOSE_TIER_I18N_KEYS: Readonly<Record<DoseTier, DoseTierI18nKey>> = {
  NOT_PRESCRIBED: 'timeline.doseNotPrescribed',
  LOW: 'timeline.doseLow',
  MEDIUM: 'timeline.doseMedium',
  HIGH: 'timeline.doseHigh',
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  const month = parts[1]
  const day = parts[2]
  return `${month}/${day}`
}

function getDoseTierFromValue(value: number): DoseTier {
  if (value >= 3) return 'HIGH'
  if (value >= 2) return 'MEDIUM'
  if (value >= 1) return 'LOW'
  return 'NOT_PRESCRIBED'
}

function buildColorKey(pillar: Pillar): string {
  return `${pillar}_color`
}

function buildDrugKey(pillar: Pillar): string {
  return `${pillar}_drug`
}

function buildTierKey(pillar: Pillar): string {
  return `${pillar}_tier`
}

interface MedTooltipPayloadItem {
  readonly dataKey: string
  readonly value: number
  readonly payload: PivotedRow
}

interface MedTooltipProps {
  readonly active?: boolean
  readonly payload?: ReadonlyArray<MedTooltipPayloadItem>
  readonly label?: string
}

function MedTooltipContent({ active, payload, label }: MedTooltipProps) {
  const { t } = useTranslation()

  if (!active || !payload || payload.length === 0) return null

  const row = payload[0].payload

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      {PILLAR_KEYS.map((pillar) => {
        const value = row[pillar] as number
        const drug = row[buildDrugKey(pillar)] as string
        const tier = (row[buildTierKey(pillar)] as DoseTier) || 'NOT_PRESCRIBED'
        const tierLabel = t(DOSE_TIER_I18N_KEYS[tier])

        return (
          <div key={pillar} className="text-xs">
            <span className="font-medium text-gray-700">
              {PILLAR_LABELS[pillar]}:
            </span>{' '}
            <span className="text-gray-500">
              {value === 0
                ? t('timeline.doseNotPrescribed')
                : drug || tierLabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function MedicationTimeline({ data }: MedicationTimelineProps) {
  const { t } = useTranslation()

  const pivotedData = useMemo(() => {
    const dateMap = new Map<string, Record<string, string | number>>()

    for (const point of data) {
      const existing = dateMap.get(point.date) ?? {
        date: point.date,
        dateFormatted: formatDate(point.date),
      }

      const updated = {
        ...existing,
        [point.pillar]: DOSE_TIER_NUMERIC[point.doseTier],
        [buildColorKey(point.pillar)]: DOSE_TIER_COLORS[point.doseTier],
        [buildDrugKey(point.pillar)]: point.drugName,
        [buildTierKey(point.pillar)]: point.doseTier,
      }

      dateMap.set(point.date, updated)
    }

    const dates = [...dateMap.keys()].sort()
    const rows: ReadonlyArray<PivotedRow> = dates.map((date) => {
      const row = dateMap.get(date) as Record<string, string | number>
      const complete: Record<string, string | number> = { ...row }

      for (const pillar of PILLAR_KEYS) {
        if (complete[pillar] === undefined) {
          complete[pillar] = 0
          complete[buildColorKey(pillar)] = DOSE_TIER_COLORS.NOT_PRESCRIBED
          complete[buildDrugKey(pillar)] = ''
          complete[buildTierKey(pillar)] = 'NOT_PRESCRIBED'
        }
      }

      return complete as PivotedRow
    })

    return rows
  }, [data])

  if (pivotedData.length === 0) return null

  return (
    <div className="w-full" role="img" aria-label={t('timeline.tabMedications')}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={pivotedData}
          margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="dateFormatted"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis
            domain={[0, 3]}
            ticks={[0, 1, 2, 3]}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
            tickFormatter={(value: number) => {
              const tier = getDoseTierFromValue(value)
              return t(DOSE_TIER_I18N_KEYS[tier])
            }}
          />
          <Tooltip content={<MedTooltipContent />} />
          <Legend
            formatter={(value: string) =>
              PILLAR_LABELS[value as Pillar] ?? value
            }
          />
          {PILLAR_KEYS.map((pillar) => (
            <Bar key={pillar} dataKey={pillar} name={pillar} maxBarSize={20}>
              {pivotedData.map((row, index) => {
                const colorHex = row[buildColorKey(pillar)] as string
                return (
                  <Cell
                    key={`${pillar}-${row.date}-${index}`}
                    fill={colorHex || DOSE_TIER_COLORS.NOT_PRESCRIBED}
                  />
                )
              })}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
