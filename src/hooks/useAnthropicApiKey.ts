export function useAnthropicApiKey(): string | undefined {
  return (
    import.meta.env['VITE_ANTHROPIC_API_KEY'] ??
    import.meta.env['VITE_CLAUDE_API_KEY']
  ) as string | undefined
}
