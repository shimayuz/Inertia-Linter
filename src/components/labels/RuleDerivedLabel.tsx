interface RuleDerivedLabelProps {
  readonly className?: string
}

export function RuleDerivedLabel({ className = '' }: RuleDerivedLabelProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ${className}`}
      aria-label="Derived from Guideline-as-Code ruleset v2, testable and deterministic"
    >
      Derived from Guideline-as-Code ruleset v2 (testable, deterministic)
    </span>
  )
}
