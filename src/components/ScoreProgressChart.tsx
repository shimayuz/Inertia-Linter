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
} from 'recharts'
import type { ScoreDataPoint } from '../engine/timeline-transforms'

interface ScoreProgressChartProps {
  readonly data: ReadonlyArray<ScoreDataPoint>
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  const month = parts[1]
  const day = parts[2]
  return `${month}/${day}`
}

interface ScoreTooltipPayloadItem {
  readonly value: number
  readonly payload: ScoreDataPoint
}

interface ScoreTooltipProps {
  readonly active?: boolean
  readonly payload?: ReadonlyArray<ScoreTooltipPayloadItem>
  readonly label?: string
}

function ScoreTooltipContent({ active, payload, label, scoreLabel, normalizedLabel }: ScoreTooltipProps & { readonly scoreLabel?: string; readonly normalizedLabel?: string }) {
  if (!active || !payload || payload.length === 0) return null

  const point = payload[0]
  const data = point.payload

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm font-bold text-indigo-600">
        {scoreLabel ?? 'Score'}: <span className="font-mono">{data.score}/{data.maxPossible}</span>
      </p>
      <p className="text-xs text-gray-400">
        {normalizedLabel ?? 'Normalized'}: <span className="font-mono">{data.normalized}%</span>
      </p>
    </div>
  )
}

export function ScoreProgressChart({ data }: ScoreProgressChartProps) {
  const { t } = useTranslation()

  const chartData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        dateFormatted: formatDate(point.date),
      })),
    [data],
  )

  if (chartData.length === 0) return null

  return (
    <div className="w-full" role="img" aria-label={t('timeline.tabScore')}>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={chartData}
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
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
            label={{
              value: t('timeline.scoreAxis'),
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12, fill: '#9ca3af' },
            }}
          />
          <Tooltip content={<ScoreTooltipContent scoreLabel={t('chart.score')} normalizedLabel={t('chart.normalized')} />} />
          <ReferenceLine
            y={50}
            stroke="#9ca3af"
            strokeDasharray="6 4"
            label={{
              value: '50%',
              position: 'right',
              fill: '#9ca3af',
              fontSize: 11,
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
