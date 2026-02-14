interface AIGeneratedLabelProps {
  readonly className?: string
}

export function AIGeneratedLabel({ className = '' }: AIGeneratedLabelProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 ${className}`}
      aria-label="This content is AI-generated"
    >
      This explanation is AI-generated
    </span>
  )
}
