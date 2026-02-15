import { useTranslation } from 'react-i18next'
import { DOMAIN_REGISTRY } from '../domains/registry.ts'

interface DomainSelectorProps {
  readonly selectedDomainId: string
}

export function DomainSelector({ selectedDomainId }: DomainSelectorProps) {
  const { t } = useTranslation('ui')

  return (
    <div className="flex flex-col gap-2">
      {DOMAIN_REGISTRY.map((domain) => {
        const isActive = domain.id === selectedDomainId
        const isStub = domain.status === 'stub'

        const cardClasses = isActive
          ? 'rounded-lg border border-violet-200 bg-violet-50 px-3 py-2'
          : 'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2'

        const badgeClasses = isActive
          ? 'rounded bg-violet-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700'
          : 'rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500'

        const labelClasses = isActive
          ? 'text-sm font-medium text-violet-800'
          : 'text-sm font-medium text-gray-500'

        return (
          <div key={domain.id} className={cardClasses}>
            <div className="flex items-center justify-between">
              <span className={labelClasses}>{domain.name}</span>
              <span className={badgeClasses}>
                {isStub ? t('domain.comingSoon') : t('domain.active')}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
