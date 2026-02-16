import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuditResult } from '../types/audit.ts'
import type { LLMContext } from '../engine/prepare-llm-context.ts'
import { useAuditChat } from '../hooks/useAuditChat.ts'
import { useAnthropicApiKey } from '../hooks/useAnthropicApiKey.ts'
import { AIGeneratedLabel } from './labels/AIGeneratedLabel.tsx'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel.tsx'
import { CitationBadge } from './CitationBadge.tsx'
import type { ChatMessage, ConversationStarter } from '../types/chat.ts'

interface AuditChatProps {
  readonly auditResult: AuditResult | null
  readonly llmContext: LLMContext | null
}

const STARTER_STYLE_BY_CATEGORY: Readonly<
  Record<ConversationStarter['category'], string>
> = {
  gap: 'border-red-200 text-red-700 hover:bg-red-50',
  blocker: 'border-amber-200 text-amber-700 hover:bg-amber-50',
  opportunity: 'border-blue-200 text-blue-700 hover:bg-blue-50',
}

function StreamingIndicator({ label }: { readonly label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-400">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
      <span className="ml-1 text-xs">{label}</span>
    </div>
  )
}

function MessageBubble({
  message,
}: {
  readonly message: ChatMessage
}) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2.5`}>
      <div
        className={`max-w-[88%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
          isUser
            ? 'bg-teal-50 text-gray-800 rounded-br-sm'
            : 'bg-gray-50 border border-gray-200 text-gray-700 rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-200">
            {message.citations.map((citation, idx) => (
              <CitationBadge
                key={citation.id}
                citation={citation}
                index={idx + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StarterPills({
  starters,
  hint,
  onSelect,
}: {
  readonly starters: ReadonlyArray<ConversationStarter>
  readonly hint: string
  readonly onSelect: (prompt: string) => void
}) {
  if (starters.length === 0) {
    return null
  }

  return (
    <div className="px-4 py-3">
      <p className="text-xs text-gray-500 mb-2">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {starters.map((starter) => (
          <button
            key={starter.prompt}
            type="button"
            onClick={() => onSelect(starter.prompt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${STARTER_STYLE_BY_CATEGORY[starter.category]}`}
          >
            {starter.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AuditChat({ auditResult, llmContext }: AuditChatProps) {
  const { t } = useTranslation()
  const apiKey = useAnthropicApiKey()
  const { messages, isStreaming, starters, sendMessage, clearChat } =
    useAuditChat(auditResult, llmContext)

  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previousAuditRef = useRef<AuditResult | null>(null)

  useEffect(() => {
    if (
      auditResult !== previousAuditRef.current &&
      previousAuditRef.current !== null
    ) {
      clearChat()
    }
    previousAuditRef.current = auditResult
  }, [auditResult, clearChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const trimmed = inputValue.trim()
    if (trimmed.length === 0 || isStreaming) {
      return
    }
    sendMessage(trimmed)
    setInputValue('')
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  if (!auditResult) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700">
            {t('chat.title')}
          </h4>
        </div>
        <p className="text-sm text-gray-400 text-center py-8">
          {t('chat.noAudit')}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50/50">
        <h4 className="text-sm font-semibold text-gray-700">
          {t('chat.title')}
        </h4>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('chat.clearChat')}
            </button>
          )}
          {apiKey ? <AIGeneratedLabel /> : <RuleDerivedLabel />}
        </div>
      </div>

      <div className="relative">
        <div className="overflow-y-auto px-4 py-3 max-h-[280px]">
          {messages.length === 0 && (
            <StarterPills
              starters={starters}
              hint={t('chat.startersHint')}
              onSelect={sendMessage}
            />
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isStreaming && (
            <StreamingIndicator label={t('chat.streaming')} />
          )}

          <div ref={messagesEndRef} />
        </div>
        {/* Draft watermark overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
        >
          <span className="text-3xl font-bold text-gray-400/15 -rotate-12 select-none whitespace-nowrap">
            {t('common.draftBadge')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-200 bg-gray-50/30">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.placeholder')}
          disabled={isStreaming}
          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={inputValue.trim().length === 0 || isStreaming}
          className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {t('chat.send')}
        </button>
      </div>
    </div>
  )
}
