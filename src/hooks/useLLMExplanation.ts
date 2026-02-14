import { useState, useEffect } from 'react'
import type { LLMContext } from '../engine/prepare-llm-context.ts'

interface LLMExplanationResult {
  readonly explanation: string
  readonly isLoading: boolean
  readonly isAIGenerated: boolean
}

function generateTemplateExplanation(context: LLMContext): string {
  const lines: string[] = []

  lines.push(
    `This patient has ${context.efCategory}, which determines the applicable guideline-directed therapy pillars.`,
  )

  for (const ps of context.pillarStatuses) {
    if (ps.status === 'MISSING' && ps.blockers.length === 0) {
      lines.push(
        `${ps.pillar} is not currently prescribed with no identified contraindication.`,
      )
    } else if (ps.status === 'UNDERDOSED') {
      lines.push(
        `${ps.pillar} is prescribed but below target dose — an optimization opportunity may exist.`,
      )
    } else if (ps.status === 'ON_TARGET') {
      lines.push(`${ps.pillar} is at guideline-recommended target dose.`)
    } else if (ps.status === 'CONTRAINDICATED') {
      lines.push(
        `${ps.pillar} is contraindicated based on current clinical parameters.`,
      )
    } else if (ps.status === 'MISSING' && ps.blockers.length > 0) {
      lines.push(
        `${ps.pillar} is not prescribed. Identified barriers: ${ps.blockers.join(', ')}.`,
      )
    }
  }

  lines.push(
    'Review the pillar cards for detailed blocker analysis and next steps.',
  )

  return lines.join(' ')
}

export function useLLMExplanation(
  context: LLMContext | null,
): LLMExplanationResult {
  const [explanation, setExplanation] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!context) {
      setExplanation('')
      return
    }

    const apiKey = import.meta.env['VITE_CLAUDE_API_KEY'] as string | undefined

    if (!apiKey) {
      setExplanation(generateTemplateExplanation(context))
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `You are a clinical decision support explanation generator. Given this GDMT audit summary (abstract status codes only, no patient data), provide a 2-3 sentence plain-language explanation of the findings. Do NOT prescribe or recommend — only describe what the audit found.\n\n${JSON.stringify(context)}`,
          },
        ],
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('API request failed')
        return res.json()
      })
      .then((data: { content: Array<{ text: string }> }) => {
        if (!cancelled) {
          setExplanation(data.content[0]?.text ?? generateTemplateExplanation(context))
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExplanation(generateTemplateExplanation(context))
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [context])

  const hasApiKey = Boolean(import.meta.env['VITE_CLAUDE_API_KEY'])

  return {
    explanation,
    isLoading,
    isAIGenerated: hasApiKey && explanation !== '' && !isLoading,
  }
}
