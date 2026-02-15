import { useState, useCallback, useEffect, useRef } from 'react'
import type { AuditResult } from '../types/audit.ts'
import type { ChatMessage, ConversationStarter } from '../types/chat.ts'
import type { LLMContext } from '../engine/prepare-llm-context.ts'
import { parseCitations } from '../engine/parse-citations.ts'
import { generateConversationStarters } from '../engine/generate-starters.ts'
import { useAnthropicApiKey } from './useAnthropicApiKey.ts'

const MAX_MESSAGES = 20

interface UseAuditChatResult {
  readonly messages: ReadonlyArray<ChatMessage>
  readonly isStreaming: boolean
  readonly starters: ReadonlyArray<ConversationStarter>
  readonly sendMessage: (content: string) => void
  readonly clearChat: () => void
}

function buildSystemPrompt(llmContext: LLMContext): string {
  const pillarLines = llmContext.pillarStatuses
    .map((ps) => {
      const blockerSuffix =
        ps.blockers.length > 0 ? ` (blockers: ${ps.blockers.join(', ')})` : ''
      return `  - ${ps.pillar}: ${ps.status}${blockerSuffix}`
    })
    .join('\n')

  return [
    'You are a clinical decision support assistant for Heart Failure GDMT (Guideline-Directed Medical Therapy) audit review. You are discussing audit findings with a physician.',
    '',
    'CRITICAL RULES:',
    '1. You do NOT have access to patient numerical values. Do not fabricate specific numbers.',
    '2. You describe and explain audit findings. You do NOT prescribe or recommend treatments.',
    '3. When citing evidence, use inline markers: [guideline:SOURCE_YEAR], [trial:TRIAL_NAME], [patient:FIELD_NAME]',
    '4. Be concise. 2-4 sentences per response unless asked for detail.',
    '',
    'Current audit context:',
    `- EF Category: ${llmContext.efCategory}`,
    '- Pillar statuses:',
    pillarLines,
  ].join('\n')
}

function generateTemplateFallback(
  userContent: string,
  llmContext: LLMContext,
): string {
  const relevantPillar = llmContext.pillarStatuses.find(
    (ps) =>
      userContent.toLowerCase().includes(ps.pillar.toLowerCase()) ||
      userContent.toLowerCase().includes(ps.status.toLowerCase()),
  )

  if (relevantPillar) {
    const blockerDetail =
      relevantPillar.blockers.length > 0
        ? ` Identified barriers: ${relevantPillar.blockers.join(', ')}.`
        : ''
    return `Based on the audit findings: ${relevantPillar.pillar} shows ${relevantPillar.status}.${blockerDetail} For detailed AI-powered analysis, please configure your Anthropic API key.`
  }

  const summary = llmContext.pillarStatuses
    .map((ps) => `${ps.pillar}: ${ps.status}`)
    .join(', ')

  return `This is a ${llmContext.efCategory} audit with the following pillar statuses: ${summary}. For detailed AI-powered analysis, please configure your Anthropic API key.`
}

function createUserMessage(content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    citations: [],
    timestamp: new Date().toISOString(),
  }
}

function createAssistantMessage(
  content: string,
  citations: ReadonlyArray<ChatMessage['citations'][number]> = [],
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    citations,
    timestamp: new Date().toISOString(),
  }
}

function trimConversation(
  messages: ReadonlyArray<ChatMessage>,
): ReadonlyArray<ChatMessage> {
  if (messages.length <= MAX_MESSAGES) {
    return messages
  }

  const trimmed: Array<ChatMessage> = []
  let remaining = [...messages]

  while (remaining.length > MAX_MESSAGES) {
    const firstUserIdx = remaining.findIndex((m) => m.role === 'user')
    if (firstUserIdx === -1) break

    const nextAssistantIdx = remaining.findIndex(
      (m, i) => i > firstUserIdx && m.role === 'assistant',
    )

    if (nextAssistantIdx === -1) {
      remaining = remaining.filter((_, i) => i !== firstUserIdx)
    } else {
      remaining = remaining.filter(
        (_, i) => i !== firstUserIdx && i !== nextAssistantIdx,
      )
    }
  }

  trimmed.push(...remaining)
  return trimmed
}

function buildConversationMessages(
  messages: ReadonlyArray<ChatMessage>,
): ReadonlyArray<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))
}

interface SSEEvent {
  readonly type?: string
  readonly delta?: { readonly type?: string; readonly text?: string }
}

function parseSSEChunk(raw: string): ReadonlyArray<string> {
  const texts: Array<string> = []
  const lines = raw.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data: ')) continue

    const jsonStr = trimmed.slice(6)
    if (jsonStr === '[DONE]') continue

    try {
      const parsed = JSON.parse(jsonStr) as SSEEvent
      if (
        parsed.type === 'content_block_delta' &&
        parsed.delta?.type === 'text_delta' &&
        parsed.delta.text
      ) {
        texts.push(parsed.delta.text)
      }
    } catch {
      // Skip malformed JSON lines
    }
  }

  return texts
}

export function useAuditChat(
  auditResult: AuditResult | null,
  llmContext: LLMContext | null,
): UseAuditChatResult {
  const [messages, setMessages] = useState<ReadonlyArray<ChatMessage>>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [starters, setStarters] = useState<ReadonlyArray<ConversationStarter>>(
    [],
  )

  const apiKey = useAnthropicApiKey()
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (auditResult) {
      setStarters(generateConversationStarters(auditResult))
    } else {
      setStarters([])
    }
  }, [auditResult])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }, [auditResult])

  const sendMessage = useCallback(
    (content: string) => {
      if (!llmContext || isStreaming) return

      const userMessage = createUserMessage(content)
      const updatedMessages = trimConversation([...messages, userMessage])

      setMessages(updatedMessages)

      if (!apiKey) {
        const fallbackText = generateTemplateFallback(content, llmContext)
        const fallbackMessage = createAssistantMessage(fallbackText)
        setMessages((prev) => trimConversation([...prev, fallbackMessage]))
        return
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      setIsStreaming(true)

      const streamingMessageId = crypto.randomUUID()
      const streamingTimestamp = new Date().toISOString()

      setMessages((prev) =>
        trimConversation([
          ...prev,
          {
            id: streamingMessageId,
            role: 'assistant',
            content: '',
            citations: [],
            timestamp: streamingTimestamp,
          },
        ]),
      )

      const systemPrompt = buildSystemPrompt(llmContext)
      const conversationMessages = buildConversationMessages(updatedMessages)

      const processStream = async (): Promise<void> => {
        let accumulated = ''

        try {
          const response = await fetch(
            'https://api.anthropic.com/v1/messages',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
              },
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                stream: true,
                system: systemPrompt,
                messages: conversationMessages,
              }),
              signal: controller.signal,
            },
          )

          if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Unknown error')
            throw new Error(
              `API request failed (${String(response.status)}): ${errorBody}`,
            )
          }

          const body = response.body
          if (!body) {
            throw new Error('Response body is null')
          }

          const reader = body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          let done = false
          while (!done) {
            const result = await reader.read()
            done = result.done
            if (done) break

            const chunk = decoder.decode(result.value, { stream: true })
            buffer += chunk

            const textParts = parseSSEChunk(buffer)

            const lastNewline = buffer.lastIndexOf('\n')
            buffer =
              lastNewline === -1 ? buffer : buffer.slice(lastNewline + 1)

            for (const text of textParts) {
              accumulated += text
            }

            if (textParts.length > 0) {
              const currentAccumulated = accumulated
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamingMessageId
                    ? { ...m, content: currentAccumulated }
                    : m,
                ),
              )
            }
          }

          const { text: parsedText, citations } = parseCitations(accumulated)

          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMessageId
                ? { ...m, content: parsedText, citations }
                : m,
            ),
          )
        } catch (error: unknown) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return
          }

          const errorMessage =
            error instanceof Error ? error.message : 'An unexpected error occurred'

          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMessageId
                ? {
                    ...m,
                    content: `I encountered an error processing your request: ${errorMessage}. Please try again.`,
                  }
                : m,
            ),
          )
        } finally {
          setIsStreaming(false)
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null
          }
        }
      }

      void processStream()
    },
    [messages, llmContext, apiKey, isStreaming],
  )

  const clearChat = useCallback(() => {
    abortControllerRef.current?.abort()
    setMessages([])
    setIsStreaming(false)

    if (auditResult) {
      setStarters(generateConversationStarters(auditResult))
    }
  }, [auditResult])

  return {
    messages,
    isStreaming,
    starters,
    sendMessage,
    clearChat,
  }
}
