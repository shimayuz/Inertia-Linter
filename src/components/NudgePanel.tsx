import { useTranslation } from 'react-i18next'
import type { Nudge, NudgePriority, NudgeType } from '../types/patient-view.ts'

interface NudgePanelProps {
  readonly nudges: ReadonlyArray<Nudge>
  readonly onDismiss: (id: string) => void
  readonly onAcknowledge: (id: string) => void
}

interface NudgeCardProps {
  readonly nudge: Nudge
  readonly onDismiss: (id: string) => void
  readonly onAcknowledge: (id: string) => void
}

const PRIORITY_BORDER: Readonly<Record<NudgePriority, string>> = {
  high: 'border-l-red-400 bg-red-50/40',
  medium: 'border-l-amber-400 bg-amber-50/40',
  low: 'border-l-green-400 bg-green-50/40',
}

const PRIORITY_LABELS: Readonly<Record<NudgePriority, string>> = {
  high: 'Important',
  medium: 'Helpful',
  low: 'Tip',
}

const PRIORITY_BADGE: Readonly<Record<NudgePriority, string>> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
}

function PillIcon() {
  return (
    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

function FlaskIcon() {
  return (
    <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function getNudgeIcon(type: NudgeType) {
  switch (type) {
    case 'medication_reminder': return <PillIcon />
    case 'appointment_reminder': return <CalendarIcon />
    case 'lab_due': return <FlaskIcon />
    case 'lifestyle_tip': return <HeartIcon />
    case 'milestone_celebration': return <StarIcon />
  }
}

function NudgeCard({ nudge, onDismiss, onAcknowledge }: NudgeCardProps) {
  const borderStyle = PRIORITY_BORDER[nudge.priority]
  const badgeStyle = PRIORITY_BADGE[nudge.priority]
  const priorityLabel = PRIORITY_LABELS[nudge.priority]

  const isActive = nudge.status === 'pending'

  return (
    <div
      className={`relative rounded-lg border border-l-4 p-4 transition-opacity duration-300 ${borderStyle} ${
        isActive ? 'opacity-100' : 'opacity-50'
      }`}
      role="article"
      aria-label={nudge.title}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 shrink-0">
          {getNudgeIcon(nudge.type)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {nudge.title}
            </h3>
            <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeStyle}`}>
              {priorityLabel}
            </span>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            {nudge.message}
          </p>

          {isActive && (
            <div className="mt-3 flex items-center gap-2">
              {nudge.actionLabel && (
                <button
                  type="button"
                  onClick={() => onAcknowledge(nudge.id)}
                  className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {nudge.actionLabel}
                </button>
              )}
              {!nudge.actionLabel && (
                <button
                  type="button"
                  onClick={() => onAcknowledge(nudge.id)}
                  className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Got it
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {isActive && (
          <button
            type="button"
            onClick={() => onDismiss(nudge.id)}
            className="shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={`Dismiss ${nudge.title}`}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  )
}

export function NudgePanel({ nudges, onDismiss, onAcknowledge }: NudgePanelProps) {
  const { t } = useTranslation()

  const activeNudges = nudges.filter((n) => n.status === 'pending')
  const completedNudges = nudges.filter((n) => n.status !== 'pending')

  if (nudges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-100 p-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <StarIcon />
        </div>
        <h3 className="text-sm font-semibold text-gray-700">
          {t('patientView.noNudges', 'All caught up!')}
        </h3>
        <p className="mt-1 text-xs text-gray-400">
          No new reminders right now. Keep up the good work.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activeNudges.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Active ({activeNudges.length})
          </p>
          {activeNudges.map((nudge) => (
            <NudgeCard
              key={nudge.id}
              nudge={nudge}
              onDismiss={onDismiss}
              onAcknowledge={onAcknowledge}
            />
          ))}
        </div>
      )}

      {completedNudges.length > 0 && (
        <div className="space-y-3 mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-300">
            Completed ({completedNudges.length})
          </p>
          {completedNudges.map((nudge) => (
            <NudgeCard
              key={nudge.id}
              nudge={nudge}
              onDismiss={onDismiss}
              onAcknowledge={onAcknowledge}
            />
          ))}
        </div>
      )}
    </div>
  )
}
