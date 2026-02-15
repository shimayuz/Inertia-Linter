import { useState, useCallback, useRef } from 'react'
import type { ImageData, ExtractionResult } from '../types/vision.ts'
import { useAnthropicApiKey } from './useAnthropicApiKey.ts'
import { EXTRACTION_PROMPT } from '../data/vision-extraction-prompt.ts'
import { parseVisionResponse } from '../engine/parse-vision-response.ts'

const EXTRACTION_TIMEOUT_MS = 30_000

interface AnthropicResponse {
  readonly content: ReadonlyArray<{ readonly text: string }>
}

interface UseVisionExtractionResult {
  readonly extract: (imageData: ImageData) => Promise<void>
  readonly result: ExtractionResult | null
  readonly isExtracting: boolean
  readonly error: string | null
}

async function callAnthropicVision(
  apiKey: string,
  imageData: ImageData,
  signal: AbortSignal,
): Promise<Response> {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageData.mediaType,
                data: imageData.base64,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    }),
    signal,
  })
}

async function fetchWithRetry(
  apiKey: string,
  imageData: ImageData,
  signal: AbortSignal,
): Promise<AnthropicResponse> {
  const response = await callAnthropicVision(apiKey, imageData, signal)

  if (response.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    if (signal.aborted) throw new Error('Extraction cancelled')
    const retryResponse = await callAnthropicVision(apiKey, imageData, signal)
    if (!retryResponse.ok) {
      throw new Error(`API request failed: ${String(retryResponse.status)}`)
    }
    return retryResponse.json() as Promise<AnthropicResponse>
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${String(response.status)}`)
  }

  return response.json() as Promise<AnthropicResponse>
}

export function useVisionExtraction(): UseVisionExtractionResult {
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const apiKey = useAnthropicApiKey()

  const extract = useCallback(
    async (imageData: ImageData): Promise<void> => {
      if (!apiKey) {
        setError('No API key configured. Set VITE_ANTHROPIC_API_KEY in .env to enable vision extraction.')
        return
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      const timeout = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT_MS)

      setIsExtracting(true)
      setError(null)
      setResult(null)

      try {
        const data = await fetchWithRetry(apiKey, imageData, controller.signal)
        const rawText = data.content[0]?.text ?? ''
        const parseResult = parseVisionResponse(rawText)

        setResult({
          snapshot: parseResult.snapshot,
          rawResponse: rawText,
          confidence: parseResult.confidence,
          warnings: parseResult.warnings,
          parseErrors: parseResult.parseErrors,
        })
      } catch (err) {
        if (controller.signal.aborted) {
          setError('Extraction timed out or was cancelled')
        } else {
          setError('Extraction failed. Please try again.')
        }
      } finally {
        clearTimeout(timeout)
        setIsExtracting(false)
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
        }
      }
    },
    [apiKey],
  )

  return { extract, result, isExtracting, error }
}
