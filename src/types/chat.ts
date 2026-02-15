export interface Citation {
  readonly type: 'guideline' | 'trial' | 'patient'
  readonly id: string
  readonly label: string
  readonly detail?: string
}

export interface ChatMessage {
  readonly id: string
  readonly role: 'user' | 'assistant'
  readonly content: string
  readonly citations: ReadonlyArray<Citation>
  readonly timestamp: string
}

export interface ConversationStarter {
  readonly label: string
  readonly prompt: string
  readonly category: 'gap' | 'blocker' | 'opportunity'
}
