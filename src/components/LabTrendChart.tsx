import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import type { LabDataPoint } from '../engine/timeline-transforms'

interface LabTrendChartProps {
  readonly data: ReadonlyArray<LabDataPoint>
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  const month = parts[1]
  const day = parts[2]
  return `${month}/${day}`
}

interface ChartDataPoint {
  readonly dateFormatted: string
  readonly egfr: number | null
  readonly potassium: number | null
  readonly sbp: number
  readonly hr: number
}

interface LabTooltipPayloadItem {
  readonly dataKey: string
  readonly value: number | null
  readonly color: string
  readonly name: string
}

interface LabTooltipProps {
  readonly active?: boolean
  readonly payload?: ReadonlyArray<LabTooltipPayloadItem>
  readonly label?: string
}

function LabTooltipContent({ active, payload, label }: LabTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      {payload.map((item) => {
        if (item.value === null || item.value === undefined) return null
        const unit = item.dataKey === 'egfr'
          ? ' mL/min'
          : item.dataKey === 'potassium'
            ? ' mEq/L'
            : item.dataKey === 'sbp'
              ? ' mmHg'
              : ' bpm'

        return (
          <div key={item.dataKey} className="text-xs">
            <span className="font-medium" style={{ color: item.color }}>
              {item.name}:
            </span>{' '}
            <span className="text-gray-600">
              {item.value}{unit}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function VitalsChart({ data }: { readonly data: ReadonlyArray<ChartDataPoint> }) {
  const { t } = useTranslation()

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="dateFormatted"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#d1d5db' }}
        />
        <YAxis
          domain={[40, 160]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#d1d5db' }}
        />
        <Tooltip content={<LabTooltipContent />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine
          y={90}
          stroke="#3b82f6"
          strokeDasharray="6 4"
          label={{
            value: t('timeline.thresholdSbp'),
            position: 'right',
            fill: '#3b82f6',
            fontSize: 10,
          }}
        />
        <Line
          type="monotone"
          dataKey="sbp"
          name="SBP"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="hr"
          name="HR"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function LabsChart({ data }: { readonly data: ReadonlyArray<ChartDataPoint> }) {
  const { t } = useTranslation()

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="dateFormatted"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#d1d5db' }}
        />
        <YAxis
          yAxisId="egfr"
          domain={[0, 120]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#d1d5db' }}
          label={{
            value: 'eGFR',
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: 10, fill: '#9ca3af' },
          }}
        />
        <YAxis
          yAxisId="potassium"
          orientation="right"
          domain={[3.0, 6.0]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#d1d5db' }}
          label={{
            value: 'K\u207A',
            angle: 90,
            position: 'insideRight',
            style: { fontSize: 10, fill: '#9ca3af' },
          }}
        />
        <Tooltip content={<LabTooltipContent />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine
          yAxisId="potassium"
          y={5.0}
          stroke="#ef4444"
          strokeDasharray="6 4"
          label={{
            value: t('timeline.thresholdK'),
            position: 'right',
            fill: '#ef4444',
            fontSize: 10,
          }}
        />
        <ReferenceLine
          yAxisId="egfr"
          y={30}
          stroke="#6366f1"
          strokeDasharray="6 4"
          label={{
            value: t('timeline.thresholdEgfr'),
            position: 'right',
            fill: '#6366f1',
            fontSize: 10,
          }}
        />
        <Line
          type="monotone"
          dataKey="egfr"
          name="eGFR"
          yAxisId="egfr"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="potassium"
          name="K\u207A"
          yAxisId="potassium"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function LabTrendChart({ data }: LabTrendChartProps) {
  const { t } = useTranslation()

  const chartData: ReadonlyArray<ChartDataPoint> = useMemo(
    () =>
      data.map((point) => ({
        dateFormatted: formatDate(point.date),
        egfr: point.egfr,
        potassium: point.potassium,
        sbp: point.sbp,
        hr: point.hr,
      })),
    [data],
  )

  if (chartData.length === 0) return null

  return (
    <div className="flex w-full flex-col gap-4" role="img" aria-label={t('timeline.tabLabs')}>
      <div>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {t('form.vitals')}
        </h4>
        <VitalsChart data={chartData} />
      </div>
      <div>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {t('form.labs')}
        </h4>
        <LabsChart data={chartData} />
      </div>
    </div>
  )
}
